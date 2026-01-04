# 🚀 النشر السريع على Dokploy

## ملخص الخطوات

### 1. إعداد Cloudflare (5 دقائق)
```
1. سجل في cloudflare.com (مجاني)
2. احصل على Account ID
3. أنشئ API Token
4. سجل البيانات في مكان آمن
```

### 2. رفع على Git (دقيقة واحدة)
```bash
git add .
git commit -m "Ready for Dokploy"
git push origin main
```

### 3. النشر على Dokploy (3 دقائق)
```
1. Create Application
2. Repository: رابط Git الخاص بك
3. Build: Dockerfile
4. Port: 3000
5. Environment Variables: انسخ من dokploy.env.example
6. Deploy!
```

## الملفات المهمة

- `Dockerfile` ✅ جاهز
- `dokploy.env.example` ✅ قالب المتغيرات
- `DOKPLOY_DEPLOYMENT.md` ✅ الدليل الكامل

## المتغيرات الإلزامية

```env
NUXT_CF_ACCOUNT_ID=xxx
NUXT_CF_API_TOKEN=xxx
NUXT_SITE_TOKEN=xxx
NUXT_HOME_URL=xxx
NITRO_PRESET=node-server
```

## الدعم

راجع `DOKPLOY_DEPLOYMENT.md` للتفاصيل الكاملة

---

**جاهز للنشر!** 🎉
