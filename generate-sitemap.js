const fs = require('fs');
const path = require('path');

// الإعدادات الأساسية
const baseUrl = 'https://shehataa1996-cloud.github.io/ahmeddev-portfolio/';
const pages = [
    { name: 'index.html', priority: '1.0', changefreq: 'weekly' },
    { name: 'about.html', priority: '0.8', changefreq: 'monthly' },
    { name: 'projects.html', priority: '0.9', changefreq: 'weekly' },
    { name: 'contact.html', priority: '0.7', changefreq: 'yearly' }
];

/**
 * دالة لتوليد ملف sitemap.xml بناءً على تاريخ تعديل الملفات الفعلي
 */
function generateSitemap() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    pages.forEach(page => {
        const filePath = path.join(__dirname, page.name);
        let lastmod = new Date().toISOString().split('T')[0]; // القيمة الافتراضية هي اليوم

        // التحقق من تاريخ آخر تعديل للملف في نظام التشغيل
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            lastmod = stats.mtime.toISOString().split('T')[0];
        }

        // معالجة الرابط الرئيسي (حذف index.html من الرابط النهائي)
        const url = page.name === 'index.html' ? baseUrl : `${baseUrl}${page.name}`;

        xml += `  <url>\n`;
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
    });

    xml += '</urlset>';

    // حفظ الملف
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml);
    console.log('✅ تم تحديث sitemap.xml بنجاح بناءً على آخر تعديلات الملفات!');
}

generateSitemap();