# Vercel Deployment Guide - CheatLock AI

## Prerequisites
✅ GitHub repository: https://github.com/Varad2111/CheatLock-AI.git
✅ Supabase project running
✅ Latest code pushed to GitHub

## Step-by-Step Deployment

### 1. Sign Up / Login to Vercel

Go to: https://vercel.com/signup

- Click "Continue with GitHub"
- Authorize Vercel to access your GitHub account

### 2. Import Your Project

1. Click "Add New..." → "Project"
2. Find "CheatLock-AI" in your repository list
3. Click "Import"

### 3. Configure Project Settings

**Root Directory:**
```
client
```
⚠️ IMPORTANT: Set this to "client" since your Next.js app is in the client folder

**Framework Preset:**
- Should auto-detect as "Next.js"

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

### 4. Add Environment Variables

Click "Environment Variables" and add these:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bmhgjflrdhtaakqfzlbl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGdqZmxyZGh0YWFrcWZ6bGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTgzNjQsImV4cCI6MjA4MDI3NDM2NH0.T9dvIlP3J8I4byb8QSBHQCRvMeDTJGWJsZJMHq6dLWU
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

⚠️ **Important:** 
- Add all three variables
- For `NEXT_PUBLIC_APP_URL`, you can use the Vercel URL (will be shown after deployment)
- Make sure to select "Production", "Preview", and "Development" for all variables

### 5. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://cheatlock-ai.vercel.app`

### 6. Update Supabase Settings

After deployment, update your Supabase project:

1. Go to: https://supabase.com/dashboard/project/bmhgjflrdhtaakqfzlbl
2. Navigate to: **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Site URL**: `https://your-app-name.vercel.app`
4. Add to **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/auth/callback
   https://your-app-name.vercel.app/**
   ```

### 7. Update Environment Variable

Go back to Vercel:
1. Project Settings → Environment Variables
2. Edit `NEXT_PUBLIC_APP_URL`
3. Change to your actual Vercel URL: `https://your-app-name.vercel.app`
4. Click "Save"
5. Redeploy: Deployments → Click "..." → "Redeploy"

## Post-Deployment Checklist

### Test These Features:

1. **Authentication**
   - [ ] Register new user
   - [ ] Login
   - [ ] Logout

2. **Camera Access**
   - [ ] Browser prompts for camera permission
   - [ ] Camera preview shows in bottom-right
   - [ ] Green "Camera Active" indicator appears

3. **Exam Flow**
   - [ ] Teacher can create exam
   - [ ] Student can take exam
   - [ ] Violations are detected
   - [ ] Auto-submit works
   - [ ] Reports generate correctly

4. **Proctoring**
   - [ ] Face detection works
   - [ ] Gaze tracking works
   - [ ] Audio detection works
   - [ ] Snapshots are captured
   - [ ] Audio recordings work

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
```bash
# Solution: Check package.json in client folder
# Make sure all dependencies are listed
```

**Error: "Root directory not found"**
```bash
# Solution: Set Root Directory to "client" in Vercel settings
```

### Camera Not Working

**Issue: Camera permission denied**
- Vercel automatically provides HTTPS ✅
- User must click "Allow" when prompted
- Check browser console for errors

**Issue: Camera preview not visible**
- Clear browser cache
- Try different browser
- Check if camera works on localhost first

### Environment Variables Not Working

**Issue: Supabase connection fails**
```bash
# Solution:
1. Verify all 3 env variables are set in Vercel
2. Make sure they're enabled for Production
3. Redeploy after adding variables
```

### Authentication Issues

**Issue: Redirect after login fails**
```bash
# Solution:
1. Add Vercel URL to Supabase redirect URLs
2. Update NEXT_PUBLIC_APP_URL in Vercel
3. Redeploy
```

## Custom Domain (Optional)

### Add Your Own Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `cheatlock.com`)
3. Follow DNS configuration instructions
4. Vercel automatically adds HTTPS certificate
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain
6. Update Supabase redirect URLs

## Monitoring

### View Logs
- Go to your project → Deployments
- Click on a deployment → "View Function Logs"
- Check for errors

### Analytics
- Vercel provides built-in analytics
- Go to Analytics tab to see traffic

## Continuous Deployment

Every time you push to GitHub:
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

## Cost

**Vercel Free Tier Includes:**
- ✅ Unlimited deployments
- ✅ HTTPS/SSL certificates
- ✅ 100GB bandwidth/month
- ✅ Automatic CI/CD
- ✅ Preview deployments

**Supabase Free Tier Includes:**
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console
3. Verify environment variables
4. Test on localhost first
5. Check Supabase dashboard for errors

## Your Deployment URLs

After deployment, you'll have:
- **Production**: `https://cheatlock-ai.vercel.app`
- **GitHub**: https://github.com/Varad2111/CheatLock-AI.git
- **Supabase**: https://bmhgjflrdhtaakqfzlbl.supabase.co

## Next Steps

1. Deploy to Vercel (follow steps above)
2. Test all features
3. Share URL with users
4. Monitor usage and errors
5. Update as needed (auto-deploys from GitHub)

---

**Ready to deploy? Go to: https://vercel.com/new**
