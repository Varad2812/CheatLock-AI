# CheatLock AI - Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Database Schema

1. Open Supabase SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Execute the SQL script

### 3. Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `violation-snapshots`
3. Set it to public access

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy violation-engine
supabase functions deploy report-generator
```

## Frontend Deployment

### Environment Variables

Create `.env.local` in the `client` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd client
vercel
```

3. Add environment variables in Vercel dashboard

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
cd client
npm run build
netlify deploy --prod
```

## Local Development

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Initial Admin Setup

### Create First Admin User

1. Sign up through the UI
2. Run this SQL in Supabase:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## Production Checklist

- [ ] Database schema deployed
- [ ] Storage bucket created and configured
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] SSL certificate configured
- [ ] Admin user created
- [ ] CORS settings configured
- [ ] Rate limiting enabled
- [ ] Backup strategy implemented
- [ ] Monitoring setup

## Security Considerations

1. **HTTPS Only**: Ensure your app runs on HTTPS
2. **RLS Policies**: Verify all RLS policies are active
3. **API Keys**: Never expose service role key in frontend
4. **CORS**: Configure allowed origins in Supabase
5. **Rate Limiting**: Implement rate limiting for API calls

## Monitoring

### Supabase Dashboard

Monitor:
- Database performance
- Storage usage
- Edge function logs
- Realtime connections

### Application Logs

Check:
- Violation detection accuracy
- WebRTC connection success rate
- User authentication issues
- Exam submission failures

## Troubleshooting

### Camera/Microphone Not Working

- Ensure HTTPS is enabled
- Check browser permissions
- Verify MediaPipe CDN is accessible

### WebRTC Connection Failed

- Check firewall settings
- Verify STUN/TURN servers
- Test network connectivity

### Database Connection Issues

- Verify Supabase credentials
- Check RLS policies
- Review connection pooling

## Scaling Considerations

### Database

- Enable connection pooling
- Add read replicas for heavy read operations
- Optimize indexes for common queries

### Storage

- Implement CDN for snapshots
- Set up automatic cleanup for old files
- Consider compression for images

### Edge Functions

- Monitor execution time
- Implement caching where appropriate
- Use database functions for complex queries

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups. For additional safety:

```bash
# Manual backup
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Storage Backups

Implement periodic backup of violation snapshots to external storage.

## Updates and Maintenance

### Database Migrations

1. Create migration file
2. Test in staging environment
3. Apply to production during low-traffic period
4. Verify data integrity

### Application Updates

1. Test thoroughly in development
2. Deploy to staging
3. Run smoke tests
4. Deploy to production
5. Monitor for issues

## Support

For issues or questions:
- Check documentation
- Review Supabase logs
- Contact support team
