# CheatLock AI - Installation Instructions

## Quick Installation (5 Minutes)

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Setup Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings → API
4. Copy your project URL and anon key

### Step 3: Configure Environment

```bash
cd client
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Setup Database

1. Open Supabase SQL Editor
2. Copy all content from `supabase/schema.sql`
3. Paste and execute

### Step 5: Setup Storage

1. Go to Storage in Supabase
2. Create bucket: `violation-snapshots`
3. Make it public

### Step 6: Run Application

```bash
npm run dev
```

Visit: `http://localhost:3000`

## Create First Admin User

1. Register through UI
2. In Supabase SQL Editor, run:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Verify Installation

✅ Database tables created (9 tables)
✅ Storage bucket created
✅ Can access login page
✅ Can register new user
✅ Admin user created

## Next Steps

1. Login as admin
2. Create teacher accounts
3. Create examiner accounts
4. Teacher creates first exam
5. Test with student account

## Troubleshooting

**Problem:** npm install fails
**Solution:** Use Node.js 18+ and npm 9+

**Problem:** Can't connect to Supabase
**Solution:** Check .env.local credentials

**Problem:** Camera not working
**Solution:** Use HTTPS or localhost

## Full Documentation

- Setup Guide: `docs/SETUP_GUIDE.md`
- API Docs: `docs/API_DOCUMENTATION.md`
- Deployment: `docs/DEPLOYMENT.md`

## Support

For detailed setup instructions, see `docs/SETUP_GUIDE.md`
