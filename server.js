const express = require('express');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // تحميل المتغيرات من ملف .env

const app = express();
app.use(compression()); // ضغط الردود لتقليل حجم البيانات المنقولة
app.use(cors()); // السماح لمتصفحك بالاتصال بالخادم
app.use(express.json()); // للسماح للخادم بفهم بيانات JSON المرسلة إليه

const PORT = process.env.PORT || 3000;

// تحسين خدمة الملفات الثابتة لتدعم الروابط النظيفة (بدون .html) وتكون أكثر استقراراً
// تحسين خدمة الملفات الثابتة مع إضافة التخزين المؤقت للمتصفح لمدة سنة
app.use(express.static(path.join(__dirname), {
    extensions: ['html', 'htm'], // يسمح بفتح projects بدلاً من projects.html
    index: 'index.html',
    maxAge: '1y', // تخزين الملفات لمدة سنة
    immutable: true,
    setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'public, max-age=0'); } // عدم تخزين صفحات HTML لضمان التحديث
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