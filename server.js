const express = require('express');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); // تحميل المتغيرات من ملف .env

const app = express();

// التحقق من وجود المتغيرات الأساسية عند التشغيل
const REQUIRED_ENV = ['GNEWS_API_KEY', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnv = [];
REQUIRED_ENV.forEach(key => {
    if (!process.env[key]) missingEnv.push(key);
});

if (missingEnv.length > 0) {
    console.error(`❌ Error: Missing required environment variables: ${missingEnv.join(', ')}`);
    process.exit(1); // إيقاف السيرفر فوراً لأن التطبيق لن يعمل بشكل صحيح بدونها
}

app.use(compression()); // ضغط الردود لتقليل حجم البيانات المنقولة
app.use(cors()); // السماح لمتصفحك بالاتصال بالخادم
app.use(express.json()); // للسماح للخادم بفهم بيانات JSON المرسلة إليه

// إضافة رؤوس الحماية (CSP & XFO) لتأمين الموقع ضد Clickjacking و XSS
app.use((req, res, next) => {
    // frame-ancestors 'self' تمنع تضمين الموقع في إطارات من مواقع خارجية
    // require-trusted-types-for تحمي من هجمات DOM XSS
    res.setHeader("Content-Security-Policy", "require-trusted-types-for 'script'; trusted-types default; frame-ancestors 'self';");
    // دعم إضافي للمتصفحات القديمة ضد Clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
});

const PORT = process.env.PORT || 3000;

// تحسين خدمة الملفات الثابتة لتدعم الروابط النظيفة (بدون .html) وتكون أكثر استقراراً
// تحسين خدمة الملفات الثابتة مع إضافة التخزين المؤقت للمتصفح لمدة سنة
app.use(express.static(path.join(__dirname), {
    extensions: ['html', 'htm'], // يسمح بفتح projects بدلاً من projects.html
    index: 'index.html',
    maxAge: '1y', // تخزين الملفات لمدة سنة
    immutable: true,
    setHeaders: (res, filePath) => {
        // منع التخزين المؤقت لملفات التكوين والصفحات لضمان تحديثها لدى محركات البحث
        const isConfigOrHtml = filePath.match(/\.(html|txt|xml|json)$/);
        if (isConfigOrHtml) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
    }
}));

// إعداد نظام الذاكرة المؤقتة (Cache) لتحسين الأداء وتوفير طلبات API
let newsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // تحديث الأخبار كل ساعة واحدة فقط

// نقطة نهاية (Endpoint) لجلب الأخبار
app.get('/api/news', async (req, res) => {
    const currentTime = Date.now();

    // 1. التحقق من وجود نسخة مخزنة صالحة (لم تمر عليها ساعة)
    if (newsCache && (currentTime - lastFetchTime < CACHE_DURATION)) {
        return res.json(newsCache);
    }

    try {
        const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
            params: {
                category: 'technology',
                lang: 'ar',
                apikey: process.env.GNEWS_API_KEY // المفتاح مخفي هنا تماماً
            },
            timeout: 5000 // تحديد مهلة 5 ثوانٍ للطلب لتجنب تأخير السيرفر
        });

        // 2. تحديث الذاكرة المؤقتة بالبيانات الجديدة
        newsCache = response.data;
        lastFetchTime = currentTime;
        res.json(newsCache);
    } catch (error) {
        // 3. في حال فشل الـ API، نرسل البيانات القديمة (Stale-while-revalidate) كحل بديل
        if (newsCache) return res.json(newsCache);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// نقطة نهاية لجلب المقالات من ملف JSON
app.get('/api/blog', (req, res) => {
    const filePath = path.join(__dirname, 'articles.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.json([]);
        try {
            res.json(data ? JSON.parse(data) : []);
        } catch (e) {
            res.json([]);
        }
    });
});

// --- مسارات المشاريع (Projects API) ---

app.get('/api/projects', (req, res) => {
    const filePath = path.join(__dirname, 'projects.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.json([]);
        try {
            res.json(data ? JSON.parse(data) : []);
        } catch (e) {
            res.json([]);
        }
    });
});

// إعداد مرسل البريد مرة واحدة خارج المسار لتحسين الأداء
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// التحقق من صحة إعدادات البريد الإلكتروني عند بدء التشغيل لضمان عمل المفتاح
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Nodemailer configuration error:', error.message);
    } else {
        console.log('✅ Server is ready to send emails using Gmail App Password');
    }
});

// --- مسار استقبال رسائل التواصل (Contact API) ---
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message || message.trim() === "") {
        return res.status(400).json({ success: false, message: 'يرجى كتابة رسالة أو تفاصيل المشروع.' });
    }

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `رسالة جديدة من: ${name}`,
        html: `
            <div dir="rtl" style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">📩 رسالة اتصال جديدة من معرض أعمالك</h2>
                <p><b>اسم المرسل:</b> ${name}</p>
                <p><b>البريد:</b> ${email}</p>
                <p><b>الهاتف:</b> ${phone || 'غير محدد'}</p>
                <hr style="border:0; border-top:1px solid #eee;">
                <p><b>محتوى الرسالة:</b></p>
                <p style="background: #f9fafb; padding: 15px; border-radius: 5px;">${message}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'تم إرسال رسالتك بنجاح! سأتواصل معك قريباً.' });
    } catch (error) {
        console.error('Detailed Nodemailer Error:', error.message);
        res.status(500).json({ success: false, message: `فشل إرسال البريد: ${error.code || 'خطأ في السيرفر'}` });
    }
});


// مسار احتياطي لمعالجة خطأ 404 وتوجيه المستخدم للرئيسية أو إظهار رسالة واضحة
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding:50px; font-family:sans-serif;">
            <h1>404 - الصفحة غير موجودة</h1>
            <p>عذراً، يبدو أن الملف <b>${req.url}</b> غير موجود على السيرفر.</p>
            <a href="/">العودة للرئيسية</a>
        </div>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});