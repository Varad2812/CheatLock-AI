# 🚀 CheatLock AI - Vercel Deployment Steps

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub: https://github.com/Varad2111/CheatLock-AI.git
- [x] Supabase project active: https://bmhgjflrdhtaakqfzlbl.supabase.co
- [x] All features tested locally
- [x] Environment variables ready

---

## 📋 Step-by-Step Deployment

### STEP 1: Open Vercel

🔗 Go to: **https://vercel.com/new**

- If you don't have an account, click "Continue with GitHub"
- Authorize Vercel to access your GitHub repositories

---

### STEP 2: Import Your Repository

1. You'll see a list of your GitHub repositories
2. Find **"CheatLock-AI"** or search for it
3. Click the **"Import"** button next to it

---

### STEP 3: Configure Build Settings

⚠️ **CRITICAL SETTINGS:**

**Root Directory:**
```
client
```
👆 Click "Edit" next to Root Directory and type `client`

**Framework Preset:**
- Should auto-detect as **Next.js** ✅

**Build Command:**
```
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```
npm install
```

---

### STEP 4: Add Environment Variables

Click **"Environment Variables"** section

Add these 3 variables (copy-paste exactly):

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://bmhgjflrdhtaakqfzlbl.supabase.co
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGdqZmxyZGh0YWFrcWZ6bGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTgzNjQsImV4cCI6MjA4MDI3NDM2NH0.T9dvIlP3J8I4byb8QSBHQCRvMeDTJGWJsZJMHq6dLWU
```

**Variable 3:**
```
Name: NEXT_PUBLIC_APP_URL
Value: https://cheatlock-ai.vercel.app
```
(You can update this after deployment with your actual URL)

✅ Make sure all variables are checked for:
- Production
- Preview  
- Development

---

### STEP 5: Deploy!

1. Click the big blue **"Deploy"** button
2. Wait 2-3 minutes while Vercel builds your app
3. You'll see a progress screen with logs
4. When done, you'll see: **"Congratulations! Your project has been deployed"** 🎉

---

### STEP 6: Get Your Deployment URL

After deployment completes:

1. You'll see your live URL (something like):
   ```
   https://cheatlock-ai-xyz123.vercel.app
   ```
2. Click **"Visit"** to open your live app
3. Copy this URL - you'll need it for the next steps

---

### STEP 7: Update Supabase Configuration

🔗 Go to: **https://supabase.com/dashboard/project/bmhgjflrdhtaakqfzlbl**

1. Click **"Authentication"** in the left sidebar
2. Click **"URL Configuration"**
3. Update these fields:

**Site URL:**
```
https://your-actual-vercel-url.vercel.app
```

**Redirect URLs:** (Add these)
```
https://your-actual-vercel-url.vercel.app/**
https://your-actual-vercel-url.vercel.app/auth/callback
http://localhost:3000/**
```

4. Click **"Save"**

---

### STEP 8: Update Vercel Environment Variable

Go back to Vercel:

1. Click on your project
2. Go to **"Settings"** tab
3. Click **"Environment Variables"** in left sidebar
4. Find `NEXT_PUBLIC_APP_URL`
5. Click **"Edit"**
6. Change value to your actual Vercel URL
7. Click **"Save"**

---

### STEP 9: Redeploy

1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

---

### STEP 10: Test Your Deployment! 🎉

Visit your app and test:

**1. Authentication:**
- Register a new account
- Login
- Logout

**2. Camera Access:**
- Start an exam as a student
- Browser should ask for camera permission
- Click "Allow"
- Camera preview should appear in bottom-right corner
- Look for green "🟢 Camera Active" indicator

**3. Create and Take Exam:**
- Login as teacher
- Create a test exam
- Add questions
- Login as student
- Take the exam
- Verify proctoring works

---

## 🎯 Your Deployment URLs

After completing all steps, you'll have:

- **Live App:** `https://your-app.vercel.app`
- **GitHub:** https://github.com/Varad2111/CheatLock-AI.git
- **Supabase:** https://bmhgjflrdhtaakqfzlbl.supabase.co
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 🔧 Troubleshooting

### Build Failed?

**Error: "Root directory not found"**
- Solution: Make sure Root Directory is set to `client`

**Error: "Cannot find module"**
- Solution: Check that all dependencies are in `client/package.json`

### Camera Not Working?

**Permission Denied:**
- Vercel provides HTTPS automatically ✅
- User must click "Allow" when browser prompts
- Try different browser if issues persist

**Preview Not Visible:**
- Check browser console (F12) for errors
- Verify camera works on localhost first
- Clear browser cache and try again

### Authentication Issues?

**Redirect Fails:**
- Verify Vercel URL is added to Supabase redirect URLs
- Check `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Redeploy after making changes

---

## 🔄 Continuous Deployment

Every time you push code to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Update your live site

No manual deployment needed! 🚀

---

## 💰 Cost

**100% FREE for your use case:**

**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ HTTPS/SSL certificates
- ✅ 100GB bandwidth/month
- ✅ Automatic CI/CD

**Supabase Free Tier:**
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users

---

## 📱 Share Your App

Once deployed, share this URL with:
- Students (to take exams)
- Teachers (to create exams)
- Admins (to manage system)

Everyone can access from:
- Desktop computers
- Laptops
- Tablets
- Mobile phones

---

## 🎓 Default Login Credentials

After deployment, you can create accounts or use:

**Admin Account:**
- Email: admin@cheatlock.ai
- Password: (create during first setup)

**Teacher Account:**
- Register at: `https://your-app.vercel.app/auth/register`
- Select "Teacher" role

**Student Account:**
- Register at: `https://your-app.vercel.app/auth/register`
- Select "Student" role

---

## ✅ Deployment Complete!

Your CheatLock AI proctoring system is now live and accessible worldwide! 🌍

**Next Steps:**
1. Test all features thoroughly
2. Create your first exam
3. Invite students to test
4. Monitor the system
5. Gather feedback

---

**Need help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

**Ready to deploy?** Start at Step 1 above! 🚀
