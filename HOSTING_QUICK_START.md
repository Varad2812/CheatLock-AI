# 🚀 Host Your Website - Quick Start

## Option 1: Vercel (Recommended) ⭐

**Best for**: Next.js apps (like yours!)
**Cost**: Free
**Time**: 5 minutes

### Steps:
1. Go to https://vercel.com/signup
2. Sign in with GitHub
3. Click "Import Project"
4. Select "CheatLock-AI"
5. Set **Root Directory** to `client`
6. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
7. Click "Deploy"
8. Done! ✅

**Your URL**: `https://cheatlock-ai.vercel.app`

---

## Option 2: Netlify

**Best for**: Static sites
**Cost**: Free
**Time**: 5 minutes

### Steps:
1. Go to https://netlify.com
2. Sign in with GitHub
3. "Add new site" → "Import from Git"
4. Select "CheatLock-AI"
5. **Base directory**: `client`
6. **Build command**: `npm run build`
7. **Publish directory**: `client/.next`
8. Add environment variables
9. Deploy!

---

## Option 3: Railway

**Best for**: Full-stack apps
**Cost**: Free tier available
**Time**: 10 minutes

### Steps:
1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub"
4. Select "CheatLock-AI"
5. Add environment variables
6. Deploy!

---

## What You Need

### From Supabase:
1. Go to your Supabase project
2. **Settings** → **API**
3. Copy:
   - Project URL
   - anon public key

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## After Deployment

### 1. Update Supabase
Go to Supabase → **Authentication** → **URL Configuration**

Add your deployment URL:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

### 2. Test Everything
- [ ] Can access the site
- [ ] Can register/login
- [ ] Can create exam
- [ ] Proctoring works
- [ ] Camera/mic permissions work

### 3. Apply Database Migration
Don't forget to run in Supabase SQL Editor:
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

---

## Comparison

| Feature | Vercel | Netlify | Railway |
|---------|--------|---------|---------|
| Next.js Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Free Tier | ✅ Generous | ✅ Good | ✅ Limited |
| Auto Deploy | ✅ | ✅ | ✅ |
| Custom Domain | ✅ | ✅ | ✅ |
| HTTPS | ✅ | ✅ | ✅ |
| Setup Time | 5 min | 5 min | 10 min |

**Recommendation**: Use **Vercel** for best Next.js experience!

---

## Quick Deploy Command

If you want to deploy from CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel

# Follow prompts
# Done!
```

---

## Troubleshooting

### Build Failed?
- Check environment variables are set
- Check for TypeScript errors
- View build logs in dashboard

### Site Loads But Blank?
- Check browser console for errors
- Verify Supabase URL is correct
- Check environment variables

### Features Don't Work?
- Verify all environment variables
- Check Supabase is not paused
- Test locally first

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update Supabase URL
3. ✅ Test all features
4. ✅ Share your live URL!

**Your site will be live at**: `https://your-app.vercel.app`

---

**Ready to deploy? Follow DEPLOY_TO_VERCEL.md for detailed steps!** 🚀
