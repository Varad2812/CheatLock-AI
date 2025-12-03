# CheatLock AI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Modern web browser

### Step 1: Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check Node.js version
- Install all dependencies
- Create .env.local file

### Step 2: Setup Supabase

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and password

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy "Project URL"
   - Copy "anon public" key

3. **Update Environment**
   ```bash
   # Edit client/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Step 3: Setup Database

1. Open Supabase SQL Editor
2. Copy entire contents of `supabase/schema.sql`
3. Paste and click "Run"
4. Wait for completion (creates 9 tables)

### Step 4: Setup Storage

1. Go to Storage in Supabase
2. Click "Create bucket"
3. Name: `violation-snapshots`
4. Make it public
5. Click "Create"

### Step 5: Run Application

```bash
cd client
npm run dev
```

Visit: http://localhost:3000

### Step 6: Create Admin User

1. Click "Register" on homepage
2. Create account with your email
3. In Supabase SQL Editor, run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

### Step 7: Test the System

1. **Login as Admin**
   - Create teacher account
   - Create examiner account
   - Create student account

2. **Login as Teacher**
   - Create a test exam
   - Add questions
   - Activate exam

3. **Login as Student**
   - Take the exam
   - Test proctoring features

4. **Login as Examiner**
   - Monitor live exam
   - View student camera feed

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database schema created (9 tables)
- [ ] Storage bucket created
- [ ] Application running on localhost:3000
- [ ] Can register new user
- [ ] Admin user created
- [ ] Can login successfully

## 🎯 What You Get

### Multi-Layer Proctoring
- ✅ AI Gaze & Head Tracking
- ✅ Voice/Mic Monitoring
- ✅ Keystroke Analysis
- ✅ System Focus Tracking
- ✅ Auto-Violation System
- ✅ Live Camera Feed
- ✅ Comprehensive Reports

### User Roles
- ✅ Admin Dashboard
- ✅ Teacher Dashboard
- ✅ Examiner Dashboard
- ✅ Student Dashboard

### Features
- ✅ Exam Creation
- ✅ Question Management
- ✅ Live Monitoring
- ✅ WebRTC Streaming
- ✅ Violation Detection
- ✅ Report Generation
- ✅ PDF Export

## 📚 Documentation

- **Full Setup:** `docs/SETUP_GUIDE.md`
- **API Reference:** `docs/API_DOCUMENTATION.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Features:** `FEATURES.md`
- **Structure:** `PROJECT_STRUCTURE.md`

## 🔧 Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions
- Try different browser

### Database Connection Failed
- Verify .env.local credentials
- Check Supabase project is active
- Ensure schema was executed

### Dependencies Installation Failed
- Update Node.js to 18+
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

## 🎓 Test Scenarios

### Test Gaze Detection
1. Start exam as student
2. Look left/right → Should trigger violation after 2s
3. Look down → Should be allowed (rough sheet)
4. Look up → Should trigger violation
5. Turn away → Should trigger face missing

### Test Audio Detection
1. Speak briefly → Should be allowed
2. Have conversation → Should trigger violation
3. Play audio → Should trigger external audio

### Test System Monitoring
1. Switch tabs → Immediate violation
2. Click outside window → Violation
3. Try to paste → Violation blocked
4. Try Ctrl+C → Blocked

### Test Live Streaming
1. Student starts exam
2. Examiner opens monitoring
3. Click "View Live"
4. Verify video appears

## 🚀 Next Steps

1. **Customize Settings**
   - Adjust violation threshold
   - Set AI sensitivity
   - Configure timeouts

2. **Create Content**
   - Add real exam questions
   - Set appropriate durations
   - Configure proctoring levels

3. **Test Thoroughly**
   - Test all violation types
   - Verify reports generate
   - Check WebRTC streaming

4. **Deploy to Production**
   - See `docs/DEPLOYMENT.md`
   - Configure domain
   - Enable SSL
   - Setup monitoring

## 💡 Tips

- **For Development:** Use localhost (camera works without HTTPS)
- **For Production:** HTTPS is required for camera/mic access
- **For Testing:** Create multiple test accounts with different roles
- **For Monitoring:** Keep examiner dashboard open during exams
- **For Reports:** Generate reports immediately after exam completion

## 🆘 Need Help?

1. Check `docs/SETUP_GUIDE.md` for detailed instructions
2. Review `docs/API_DOCUMENTATION.md` for API details
3. See `FEATURES.md` for complete feature list
4. Check browser console for errors
5. Review Supabase logs for backend issues

## 🎉 You're Ready!

CheatLock AI is now set up and ready to use. Start creating exams and testing the proctoring features!

For production deployment, see `docs/DEPLOYMENT.md`
