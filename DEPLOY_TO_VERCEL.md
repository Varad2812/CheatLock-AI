# 🚀 Deploy CheatLock AI to Vercel

## Why Vercel?

- ✅ **Free** for personal projects
- ✅ **Optimized for Next.js** (made by same team)
- ✅ **Automatic deployments** from GitHub
- ✅ **HTTPS included**
- ✅ **Global CDN**
- ✅ **Easy setup** (5 minutes)

## Step 1: Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. You're in! ✅

## Step 2: Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find **"CheatLock-AI"** in the list
3. Click **"Import"**

## Step 3: Configure Project

### Root Directory
Since your Next.js app is in the `client` folder:

**Root Directory**: `client`

### Build Settings (Auto-detected)
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment Variables (IMPORTANT!)

Click **"Environment Variables"** and add these:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to get these:**
1. Go to your Supabase project
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes ⏳
3. Your site is live! 🎉

You'll get a URL like: `https://cheatlock-ai.vercel.app`

## Step 5: Configure Supabase for Production

### Update Supabase Site URL

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add your Vercel URL:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### Update CORS (if needed)

In Supabase SQL Editor:
```sql
-- Allow your Vercel domain
-- (Usually not needed, but just in case)
```

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Try to register/login
3. Test exam functionality
4. Check if proctoring works

## Automatic Deployments

Now, whenever you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy the new version
4. Update your live site

## Custom Domain (Optional)

Want your own domain like `cheatlock.com`?

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In Vercel: **Settings** → **Domains**
3. Add your domain
4. Update DNS records (Vercel will show you how)

## Troubleshooting

### Build Failed?

**Check build logs** in Vercel dashboard.

Common issues:
- Missing environment variables
- TypeScript errors
- Missing dependencies

### Site Loads But Features Don't Work?

**Check environment variables:**
1. Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Verify Supabase URL and key are correct
4. Redeploy after adding variables

### Camera/Mic Not Working?

**HTTPS Required!** Vercel provides HTTPS automatically, so this should work.

If not:
- Check browser permissions
- Try different browser
- Check console for errors

### Database Connection Failed?

**Check Supabase settings:**
1. Verify environment variables
2. Check Supabase is not paused
3. Verify RLS policies allow access

## Production Checklist

Before going live:

- [ ] Environment variables set in Vercel
- [ ] Supabase URL updated with Vercel domain
- [ ] Database migrations applied
- [ ] Test user registration
- [ ] Test exam creation
- [ ] Test proctoring features
- [ ] Test on mobile devices
- [ ] Check all pages load
- [ ] Verify HTTPS works
- [ ] Test camera/microphone permissions

## Monitoring

### Vercel Analytics (Free)

1. Go to your project in Vercel
2. Click **Analytics**
3. See visitor stats, performance, etc.

### Check Logs

1. Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click on a deployment
4. View **Build Logs** or **Function Logs**

## Costs

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ HTTPS
- ✅ Automatic deployments
- ✅ Preview deployments

### If You Exceed Free Tier:
- Upgrade to Pro ($20/month)
- Or optimize to stay within limits

## Alternative: Deploy to Netlify

If you prefer Netlify:

1. Go to https://netlify.com
2. **Add new site** → **Import from Git**
3. Choose GitHub → Select repo
4. **Base directory**: `client`
5. **Build command**: `npm run build`
6. **Publish directory**: `client/.next`
7. Add environment variables
8. Deploy!

## Summary

### Quick Deploy Steps:
1. ✅ Sign up for Vercel with GitHub
2. ✅ Import CheatLock-AI project
3. ✅ Set root directory to `client`
4. ✅ Add Supabase environment variables
5. ✅ Click Deploy
6. ✅ Update Supabase with Vercel URL
7. ✅ Test everything

**Your site will be live in 5 minutes!** 🚀

---

**Need help?** Check the Vercel docs: https://vercel.com/docs
