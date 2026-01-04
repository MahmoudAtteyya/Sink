# 🚀 دليل نشر Sink على Dokploy (بدون Cloudflare)

## ✅ **الأخبار الجيدة!**

تم تعديل المشروع ليعمل **بدون حاجة لـ Cloudflare**! 

### 💾 ما التغيير؟
- **القديم**: يعتمد على Cloudflare KV (سحابي)
- **الجديد**: يستخدم SQLite (قاعدة بيانات محلية)

---

## 📋 المتطلبات

- ✅ حساب Dokploy
- ✅ Git repository
- ✅ Domain (اختياري)
- ❌ **لا حاجة لـ Cloudflare!**

---

## 🚀 خطوات النشر السريعة

### 1. رفع المشروع على Git

```bash
git add .
git commit -m "Deploy to Dokploy with SQLite"
git push origin main
```

### 2. إنشاء Application في Dokploy

1. اذهب إلى Dokploy Dashboard
2. اضغط **Create Application**
3. املأ البيانات:
   ```
   Name: sink-url-shortener
   Repository: رابط Git repository
   Branch: main
   Build Type: Dockerfile
   Port: 3000
   ```

### 3. إضافة Environment Variables

```env
# Site Configuration
NUXT_SITE_TOKEN=MySecurePassword123
NUXT_HOME_URL=https://your-app-url.dokploy.com

# Basic Settings
NUXT_PUBLIC_PREVIEW_MODE=false
NUXT_PUBLIC_SLUG_DEFAULT_LENGTH=6
NUXT_REDIRECT_STATUS_CODE=301
NUXT_LINK_CACHE_TTL=60
NUXT_REDIRECT_WITH_QUERY=false
NUXT_DATASET=sink

# Deployment
NITRO_PRESET=node-server
NODE_ENV=production

# Data Storage (مهم!)
DATA_DIR=/app/data
```

### 4. إعدادات Volume (لحفظ البيانات)

⚠️ **مهم جداً**: لحفظ البيانات عند إعادة تشغيل التطبيق:

في Dokploy، أضف **Volume**:
```
Volume Path: /app/dat
Mount Path: /app/data
```

هذا يضمن عدم فقدان الروابط عند إعادة النشر!

### 5. Deploy!

اضغط **Deploy** وانتظر 5-10 دقائق

---

## 🎉 الوصول للتطبيق

- **الرئيسية**: `https://your-app.dokploy.com`
- **Dashboard**: `https://your-app.dokploy.com/dashboard`
- **Login**: استخدم `NUXT_SITE_TOKEN` من environment variables

---

## 💾 قاعدة البيانات

### SQLite بدلاً من Cloudflare KV

المشروع الآن يستخدم SQLite:
- ✅ **سريع** - كل شيء محلي
- ✅ **مجاني** - لا تكاليف إضافية
- ✅ **بسيط** - لا حاجة لإعداد خارجي
- ⚠️ **يحتاج Volume** - لحفظ البيانات

### مكان قاعدة البيانات

```
/app/data/sink.db
```

### Backup البيانات

لعمل backup:
```bash
# في Dokploy Terminal
docker cp container_name:/app/data/sink.db ./backup.db
```

---

## 🔧 الميزات المتوفرة

✅ **يعمل:**
- إنشاء روابط مختصرة
- حذف وتعديل الروابط
- قائمة جميع الروابط
- إعادة توجيه الروابط
- تخزين البيانات
- Analytics بسيط

❌ **لا يعمل** (يحتاج Cloudflare):
- AI Slug Generation
- Cloudflare Analytics Engine
- Workers Analytics
- Real-time Globe

---

## 🐛 استكشاف الأخطاء

### المشكلة: البيانات تختفي بعد Redeploy
```
✅ الحل: تأكد من إضافة Volume في Dokploy
Volume: /app/data → /app/data
```

### المشكلة: خطأ "cannot open database"
```
✅ الحل: تأكد من DATA_DIR في environment variables
DATA_DIR=/app/data
```

### المشكلة: Build يفشل
```
✅ الحل:
1. تأكد من pnpm-workspace.yaml صحيح
2. تأكد من better-sqlite3 في package.json
3. راجع Dokploy logs
```

---

## 📊 الأداء

### متطلبات الموارد
- **RAM**: 512MB - 1GB
- **CPU**: 1 vCPU
- **Storage**: 1GB (يزيد حسب عدد الروابط)

### السعة
- يدعم **آلاف الروابط** بدون مشاكل
- SQLite سريع جداً للقراءة
- الكتابة جيدة للاستخدام المتوسط

---

## 🔄 التحديثات

```bash
# بعد التعديلات
git add .
git commit -m "Update"
git push origin main

# Dokploy سينشر تلقائياً
```

---

## 🆚 Cloudflare vs SQLite

| الميزة | Cloudflare | SQLite |
|--------|------------|--------|
| السعر | مجاني (حدود) | مجاني 100% |
| الإعداد | معقد | بسيط |
| السرعة | سريع جداً | سريع |
| التوسع | ممتاز | جيد |
| Analytics | متقدم | بسيط |
| Backup | تلقائي | يدوي |

---

## 💡 نصائح

### 1. Backup دوري
اعمل backup للبيانات أسبوعياً:
```bash
# Automation script
0 0 * * 0 docker cp sink_container:/app/data/sink.db ./backups/sink_$(date +\%Y\%m\%d).db
```

### 2. مراقبة الحجم
راقب حجم قاعدة البيانات:
```bash
du -h /app/data/sink.db
```

### 3. تنظيف البيانات
احذف الروابط القديمة والمنتهية من Dashboard

---

## 🎯 الخلاصة

✅ **التطبيق جاهز 100% للنشر بدون Cloudflare!**

المميزات:
- 🚀 نشر سهل وسريع
- 💰 مجاني بالكامل
- 🔒 بياناتك محلية
- ⚡ أداء ممتاز

---

**تم بواسطة Antigravity AI** ✨
