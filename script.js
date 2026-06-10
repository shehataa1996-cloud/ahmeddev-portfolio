/**
 * ملف JavaScript الأساسي للموقع
 * يحتوي على وظائف التحكم في التمرير، القائمة الجانبية، معرض الصور والتحريكات
 */

document.addEventListener('DOMContentLoaded', () => {
    // تهيئة جميع مميزات الموقع بمجرد تحميل مستند HTML بالكامل
    initHeaderScroll();
    initMobileMenu();
    initLightbox();
    // تم استبدال initRevealAnimations بمكتبة AOS لتحسين الأداء والمرونة
    // initRevealAnimations(); 
    
    // تفعيل التحميل الديناميكي للبيانات من السيرفر
    initProjectsPage();
    initHomeProjectsPreview();
    initBlogSection();

    initTestimonialsCarousel();
    initTechNews();
    initContactForm();
    initScrollToTop();
    initTiltEffect();
    initWhatsappTooltip();

    // تهيئة مكتبة AOS (Animate On Scroll)
    AOS.init({
        duration: 800, // مدة التحريك بالمللي ثانية
        once: true,    // لتشغيل التحريك مرة واحدة فقط عند التمرير لأسفل
    });
});

// --- 1. Header & Navigation Logic ---

/**
 * وظيفة التحكم في شريط التنقل (Header)
 * تقوم بتغيير ألوان الهيدر وإضافة تأثيرات عند التمرير لأسفل الصفحة لضمان سهولة القراءة
 */
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    
    // نقوم بتطبيق تأثير التمرير فقط إذا كان الهيدر شفافاً في البداية (مثل الصفحة الرئيسية)
    if (!header || !header.classList.contains('is-transparent')) return;

    // إنشاء عنصر وهمي (Sentinel) ليكون بمثابة نقطة مراقبة عند التمرير
    // نضعه عند مسافة 50 بكسل من أعلى الصفحة ليعمل كمشغل (Trigger)
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '50px';
    sentinel.style.left = '0';
    sentinel.style.height = '1px';
    sentinel.style.width = '1px';
    sentinel.style.pointerEvents = 'none';
    document.body.prepend(sentinel);

    // إنشاء المراقب
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // إذا كان العنصر الوهمي لا يتقاطع مع الرؤية (أي خرج من أعلى الشاشة)
            // فهذا يعني أن المستخدم قام بالتمرير لأكثر من 50 بكسل
            if (!entry.isIntersecting) {
                header.classList.add('bg-white/70', 'backdrop-blur-xl', 'shadow-2xl', 'py-2', 'text-slate-900', 'border-b', 'border-white/20');
                header.classList.remove('py-4', 'text-white');
            } else {
                header.classList.remove('bg-white/70', 'backdrop-blur-xl', 'shadow-2xl', 'py-2', 'text-slate-900', 'border-b', 'border-white/20');
                header.classList.add('py-4', 'text-white');
            }
        });
    }, { threshold: 0 });

    observer.observe(sentinel);
}

/**
 * وظيفة القائمة الجانبية للهواتف
 * تقوم بفتح وإغلاق قائمة التنقل عند الضغط على زر القائمة (Hamburger Menu) في الأجهزة المحمولة
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');
    
    if (!menuBtn || !menu) return;

    // تهيئة سمات ARIA للحالة الأولية (القائمة مغلقة افتراضيًا)
    menuBtn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    // ربط الزر بالقائمة التي يتحكم فيها لأغراض إمكانية الوصول
    menuBtn.setAttribute('aria-controls', menu.id);
    
    menuBtn.addEventListener('click', () => {
        const classes = ['hidden', 'flex', 'flex-col', 'absolute', 'top-16', 'left-0', 'w-full', 'bg-white', 'p-6', 'text-slate-900'];
        classes.forEach(cls => menu.classList.toggle(cls));

        // بعد تبديل الفئات، نتحقق من الحالة الجديدة للقائمة
        const isNowOpen = !menu.classList.contains('hidden');
        
        // تحديث سمات ARIA بناءً على الحالة الجديدة
        menuBtn.setAttribute('aria-expanded', isNowOpen ? 'true' : 'false');
        menu.setAttribute('aria-hidden', isNowOpen ? 'false' : 'true');
    });
}

// --- 2. Portfolio Gallery (Lightbox) ---

/**
 * وظيفة معرض الصور (Lightbox)
 * تسمح بعرض صور المشاريع بشكل مكبّر في نافذة منبثقة عند الضغط عليها
 */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.getElementById('close-lightbox');
    const triggers = document.querySelectorAll('.lightbox-trigger');

    if (!lightbox || !lightboxImg) return;

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const img = trigger.querySelector('img');
            if (img && img.src) {
                lightboxImg.src = img.src;
                lightbox.classList.replace('hidden', 'flex');
                // منع تمرير الصفحة الرئيسية عند فتح معرض الصور
                document.body.style.overflow = 'hidden';
                setTimeout(() => lightboxImg.classList.remove('scale-95'), 10);
            }
        });
    });

    const hideLightbox = () => {
        // إضافة تأثير التصغير قبل إغلاق النافذة
        lightboxImg.classList.add('scale-95');
        setTimeout(() => {
            lightbox.classList.replace('flex', 'hidden');
            // إعادة تمكين التمرير في الصفحة
            document.body.style.overflow = '';
        }, 200);
    };

    closeLightbox?.addEventListener('click', hideLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === closeLightbox) hideLightbox();
    });
}

/**
 * وظيفة تأثير الإمالة ثلاثي الأبعاد (3D Tilt)
 */
function initTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // موقع الماوس الأفقي داخل البطاقة
            const y = e.clientY - rect.top;  // موقع الماوس الرأسي داخل البطاقة
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // حساب زوايا الدوران (قسمة الفرق على 15 للتحكم في شدة الإمالة)
            const rotateX = (centerY - y) / 15;
            const rotateY = (x - centerX) / 15;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.classList.add('shadow-indigo-500/20');
        });
        
        card.addEventListener('mouseleave', () => {
            // إعادة البطاقة لوضعها الطبيعي عند خروج الماوس
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.classList.remove('shadow-indigo-500/20');
        });
    });
}

/**
 * تهيئة سلايدر شهادات العملاء باستخدام Swiper.js
 */
function initTestimonialsCarousel() {
    if (!document.querySelector('.testimonials-slider')) return;

    new Swiper('.testimonials-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    });
}

/**
 * وظيفة التحكم في نموذج الاتصال
 * تقوم بإرسال البيانات عبر AJAX وإظهار حالة التحميل والنجاح
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const feedback = document.getElementById('form-feedback');
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.loading-spinner');

    // دالة مساعدة للتحقق من تنسيق البريد الإلكتروني
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // التحقق من أن المستخدم قام بتغيير المعرّف الافتراضي
        if (form.action.includes('yourformid')) {
            showFeedback("خطأ في الإعداد: يرجى استبدال 'yourformid' بمعرّف Formspree الخاص بك.", "error");
            return;
        }

        const emailInput = form.querySelector('input[name="email"]');

        // التحقق من صحة البريد الإلكتروني قبل الإرسال
        if (emailInput && !validateEmail(emailInput.value)) {
            showFeedback("يرجى إدخال بريد إلكتروني صحيح.", "error");
            return;
        }

        // تفعيل حالة التحميل (Loading State)
        btn.disabled = true;
        btnText.classList.add('opacity-50');
        spinner.classList.remove('hidden');
        feedback.classList.add('hidden');

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                showFeedback("تم إرسال رسالتك بنجاح! سأتواصل معك قريباً.", "success");
                form.reset();
            } else {
                const data = await response.json();
                if (data.errors) {
                    showFeedback(data.errors.map(error => error.message).join(", "), "error");
                } else {
                    throw new Error();
                }
            }
        } catch (error) {
            showFeedback("عذراً، حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.", "error");
        } finally {
            btn.disabled = false;
            btnText.classList.remove('opacity-50');
            spinner.classList.add('hidden');
        }
    });

    // دالة موحدة لإظهار رسائل التغذية الراجعة
    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `p-4 rounded-xl text-sm font-medium mb-4 animate-fade-in-up block ${
            type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`;
        feedback.classList.remove('hidden');
    }
}

// متغيرات لتخزين الأخبار والحالة الحالية للفلترة
let allNewsArticles = [];
let activeSourceFilter = null;

/**
 * جلب أخبار التكنولوجيا ديناميكياً من API
 */
async function initTechNews() {
    const newsGrid = document.getElementById('news-grid');
    const viewAllBtn = document.getElementById('view-all-news');
    if (!newsGrid || !viewAllBtn) return;

    // نقوم بطلب الأخبار من السيرفر الخاص بنا (Proxy) لحل مشكلة الحظر وحماية مفتاح الـ API
    const url = '/api/news';

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            allNewsArticles = data.articles;
            renderNews(allNewsArticles);

            // مستمع لفلترة الأخبار عند الضغط على الأوسمة
            newsGrid.addEventListener('click', (e) => {
                const tagBtn = e.target.closest('.source-tag-btn');
                if (!tagBtn) return;
                
                activeSourceFilter = tagBtn.dataset.source;
                const filtered = allNewsArticles.filter(a => a.source.name === activeSourceFilter);
                renderNews(filtered);
            });

            // مستمع لزر "عرض الكل"
            viewAllBtn.addEventListener('click', () => {
                activeSourceFilter = null;
                renderNews(allNewsArticles);
            });
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

/**
 * دالة لتحديد لون الوسم بناءً على اسم المصدر
 */
function getSourceTheme(name) {
    const themes = {
        'البوابة العربية للأخبار التقنية': 'bg-blue-50 text-blue-600 border-blue-100',
        'سكاي نيوز عربية': 'bg-red-50 text-red-600 border-red-100',
        'العربية نت': 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return themes[name] || 'bg-indigo-50 text-indigo-600 border-indigo-100';
}

/**
 * دالة عرض الأخبار وتحديث حالة زر "عرض الكل"
 */
function renderNews(articles) {
    const newsGrid = document.getElementById('news-grid');
    const viewAllBtn = document.getElementById('view-all-news');
    if (!newsGrid || !viewAllBtn) return;

    newsGrid.innerHTML = '';

    // إظهار أو إخفاء زر "عرض الكل" بناءً على حالة الفلترة
    if (activeSourceFilter) {
        viewAllBtn.classList.remove('hidden');
    } else {
        viewAllBtn.classList.add('hidden');
    }

    articles.slice(0, 6).forEach((article, index) => {
        const theme = getSourceTheme(article.source.name);
        const articleHTML = `
            <article class="group bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500" data-aos="fade-up" data-aos-delay="${(index % 3 + 1) * 100}">
                <div class="relative h-48 overflow-hidden">
                    <img src="${article.image || 'https://via.placeholder.com/800x400'}" alt="${article.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <button data-source="${article.source.name}" class="source-tag-btn absolute top-4 right-4 ${theme} backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 z-10">
                        ${article.source.name}
                    </button>
                </div>
                <div class="p-8">
                    <div class="flex items-center gap-2 text-xs text-slate-400 mb-4 font-bold">
                        <span>${new Date(article.publishedAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <h3 class="text-xl font-bold mb-3 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">${article.title}</h3>
                    <p class="text-slate-500 text-sm leading-relaxed mb-6 font-light line-clamp-3">${article.description}</p>
                    <a href="${article.url}" target="_blank" class="text-indigo-600 font-bold text-sm flex items-center gap-2 group/link">
                        اقرأ المزيد
                        <i class="fas fa-arrow-left group-hover/link:-translate-x-1 transition-transform"></i>
                    </a>
                </div>
            </article>
        `;
        newsGrid.insertAdjacentHTML('beforeend', articleHTML);
    });

    if (window.AOS) AOS.refresh();
}

// --- 4. Navigation Utilities ---

/**
 * وظيفة زر العودة للأعلى ومؤشر التقدم الدائري
 * تقوم بحساب نسبة التمرير لتحديث الدائرة وإظهار الزر بعد تخطي مسافة معينة
 */
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-to-top');
    const progressCircle = document.getElementById('scroll-progress-circle');
    const circumference = 2 * Math.PI * 42;

    if (!scrollTopBtn) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // حساب المسافة الكلية القابلة للتمرير ونسبة التقدم الحالية
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = totalHeight > 0 ? (window.scrollY / totalHeight) : 0;
                const offset = circumference - (scrollPercent * circumference);
                
                // تحديث خاصية strokeDashoffset لرسم دائرة التقدم
                if (progressCircle) progressCircle.style.strokeDashoffset = offset;

                // إظهار الزر عند التمرير لأكثر من 400 بكسل
                if (window.scrollY > 400) {
                    scrollTopBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
                } else if (scrollTopBtn.classList.contains('opacity-0') === false) { // Only add if not already hidden
                    scrollTopBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // التمرير السلس لأعلى الصفحة عند الضغط على الزر
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/**
 * وظيفة التحكم في تلميح الوتساب على الهواتف
 * تظهر التلميح عند النقر وتخفيه تلقائياً بعد ثانيتين
 */
function initWhatsappTooltip() {
    const whatsappBtn = document.querySelector('.whatsapp-glow');
    if (!whatsappBtn) return;

    // تعريف ملف الصوت (صوت تنبيه خفيف)
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    notificationSound.volume = 0.3; // خفض مستوى الصوت ليكون "خفيفاً" وغير مزعج

    let tooltipTimeout;

    const triggerTooltipSound = () => {
        notificationSound.currentTime = 0; // إعادة الصوت للبداية لضمان التشغيل الفوري عند التكرار
        notificationSound.play().catch(() => {
            // تجاهل الخطأ إذا منع المتصفح تشغيل الصوت قبل تفاعل المستخدم مع الصفحة
        });
    };

    whatsappBtn.addEventListener('click', (e) => {
        // نطبق هذا السلوك فقط على الشاشات التي يقل عرضها عن 768 بكسل
        if (window.innerWidth <= 768) {
            whatsappBtn.classList.add('show-tooltip');
            triggerTooltipSound();
            
            // مسح أي مؤقت سابق لضمان عمل العداد من جديد في حال النقر المتكرر
            clearTimeout(tooltipTimeout);
            
            tooltipTimeout = setTimeout(() => {
                whatsappBtn.classList.remove('show-tooltip');
            }, 2000); // 2000 مللي ثانية = ثانيتين
        }
    });

    // تشغيل الصوت عند الحوم (Hover) في أجهزة الكمبيوتر
    whatsappBtn.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) {
            triggerTooltipSound();
        }
    });
}

/**
 * وظيفة عرض مقالات المدونة الشخصية
 */
function initBlogSection() {
    const blogGrid = document.getElementById('blog-grid');
    if (!blogGrid) return;

    // جلب البيانات من السيرفر
    fetch('articles.json')
        .then(response => response.json())
        .then(myArticles => {
            renderBlogCards(myArticles, blogGrid);
        })
        .catch(err => console.error('Error fetching blog articles:', err));
}

function renderBlogCards(myArticles, blogGrid) {
    blogGrid.innerHTML = myArticles.map((post, index) => `
        <div class="tilt-card group relative bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-500" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="relative h-64 overflow-hidden rounded-[2rem] mb-6">
                <img src="${post.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                <div class="absolute top-4 right-4">
                    <span class="blog-badge">مقال حصري</span>
                </div>
            </div>
            <div class="px-4 pb-4">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-indigo-600 font-bold text-xs uppercase tracking-widest">${post.category}</span>
                    <div class="read-time">
                        <i class="far fa-clock"></i>
                        <span>${post.readTime}</span>
                    </div>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                    ${post.title}
                </h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-6">
                    ${post.excerpt}
                </p>
                <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span class="text-slate-400 text-xs">${post.date}</span>
                    <a href="#" class="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm group/btn">
                        اقرأ الآن
                        <i class="fas fa-arrow-left transition-transform group-hover/btn:-translate-x-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // إعادة تفعيل تأثير الإمالة للبطاقات الجديدة
    initTiltEffect();
}

/**
 * وظيفة عرض المشاريع ديناميكياً في صفحة المشاريع
 */
function initProjectsPage() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    fetch('projects.json')
        .then(res => res.json())
        .then(projects => {
            grid.innerHTML = projects.map((p, index) => `
                <div class="project-card tilt-card relative min-h-[400px] rounded-3xl overflow-hidden shadow-2xl group cursor-zoom-in lightbox-trigger border border-white/10 bg-slate-900" data-aos="fade-up" data-aos-delay="${(index % 3 + 1) * 100}">
                    <picture class="absolute inset-0 w-full h-full">
                        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700" loading="lazy">
                    </picture>
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="font-bold text-2xl text-white">${p.title}</h3>
                            <span class="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold shadow-lg">${p.category}</span>
                        </div>
                        <p class="text-gray-300 text-sm mb-6 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">${p.excerpt}</p>
                        <a href="${p.link}" target="_blank" class="inline-block w-full text-center bg-white/10 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl font-bold hover:bg-white hover:text-indigo-900 transition-all duration-300">معاينة المشروع مباشرة</a>
                    </div>
                </div>
            `).join('');
            
            // إعادة تفعيل التأثيرات البصرية بعد تحميل العناصر الجديدة
            if (window.initTiltEffect) initTiltEffect();
            if (window.initLightbox) initLightbox();
            if (window.AOS) AOS.refresh();
        })
        .catch(err => console.error('Error fetching projects:', err));
}

/**
 * وظيفة عرض معاينة لآخر المشاريع في الصفحة الرئيسية
 */
function initHomeProjectsPreview() {
    const grid = document.getElementById('home-projects-grid');
    if (!grid) return;

    fetch('projects.json')
        .then(res => res.json())
        .then(projects => {
            // نأخذ أول 3 مشاريع فقط للعرض في الصفحة الرئيسية
            const latestProjects = projects.slice(0, 3);
            
            grid.innerHTML = latestProjects.map((p, index) => `
                <div class="project-card tilt-card relative min-h-[400px] rounded-3xl overflow-hidden shadow-xl group border border-slate-100 bg-slate-900" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
                    <img src="${p.image}" alt="${p.title}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="font-bold text-2xl text-white">${p.title}</h3>
                            <span class="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold">${p.category}</span>
                        </div>
                        <p class="text-gray-300 text-sm mb-6 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-3">${p.excerpt}</p>
                        <a href="${p.link}" target="_blank" class="inline-block w-full text-center bg-white/10 backdrop-blur-md border border-white/20 text-white py-3 rounded-xl font-bold hover:bg-white hover:text-indigo-900 transition-all">معاينة المشروع</a>
                    </div>
                </div>
            `).join('');
            
            if (window.initTiltEffect) initTiltEffect();
            if (window.AOS) AOS.refresh();
        })
        .catch(err => console.error('Error loading projects preview:', err));
}