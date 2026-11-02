# PulseCity Deployment Checklist

Use this checklist to track progress from development to production.

## Pre-Launch Checklist

### 🗄️ Database Setup
- [ ] Create Supabase project at supabase.com
- [ ] Copy project URL to `.env.local`
- [ ] Copy API key to `.env.local`
- [ ] Run SQL migration: `supabase/migrations/001_init_pulsecity_schema.sql`
  - [ ] Paste entire SQL file into Supabase SQL Editor
  - [ ] Click "Run"
  - [ ] Check all tables created (profiles, issues, votes, comments, status_history, notifications)
- [ ] Verify Row-Level Security is enabled
- [ ] Check RLS policies are in place

### 💾 Storage Setup
- [ ] Create storage bucket in Supabase
  - [ ] Name: `issue-photos`
  - [ ] Visibility: **Public**
  - [ ] Size limit: 50MB+
- [ ] Test bucket is accessible

### 🔑 API Keys & Credentials
- [ ] Google Maps API key in `.env.local` ✓
- [ ] Supabase URL in `.env.local` ✓
- [ ] Supabase Anon Key in `.env.local` ✓
- [ ] All env vars without placeholder values
- [ ] `.env.local` is in `.gitignore` (never commit secrets!)

### 🧪 Testing
- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` and app loads
- [ ] Test citizen signup
- [ ] Test report creation with photo
- [ ] Test issue appears on map
- [ ] Test upvoting
- [ ] Test staff dashboard
- [ ] Test issue assignment
- [ ] Test status updates
- [ ] Test notifications
- [ ] Test comments
- [ ] Test timeline

### 🏗️ Build
- [ ] Run `npm run build` without errors
- [ ] `dist/` folder generated
- [ ] Check `dist/index.html` exists
- [ ] Check `dist/assets/` contains JS/CSS bundles

### 📱 Responsive Design
- [ ] Test on desktop (1920px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Map renders correctly on all sizes
- [ ] Sidebar is responsive

### 🔒 Security
- [ ] Row-Level Security policies verified
- [ ] Users can't modify other users' issues
- [ ] Voting limit enforced (one per user per issue)
- [ ] Staff can't see sensitive data beyond their role
- [ ] Photo storage is protected

### 📊 Performance
- [ ] Page load time < 3s
- [ ] Real-time updates work (issues, comments, notifications)
- [ ] No console errors
- [ ] No console warnings
- [ ] Network requests optimized

### 📝 Documentation
- [ ] README.md updated
- [ ] SETUP.md complete
- [ ] QUICKSTART.md ready
- [ ] IMPLEMENTATION.md finished
- [ ] ADMIN_QUERIES.sql in place

## Deployment Checklist

### ☁️ Choose Host
Select one:
- [ ] **Vercel** (easiest, recommended)
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Auto-deploy on push
  - [ ] Enable preview deployments

- [ ] **Netlify**
  - [ ] Connect GitHub repo
  - [ ] Set build command: `npm run build`
  - [ ] Set publish directory: `dist`
  - [ ] Set environment variables
  - [ ] Enable auto-deploy

- [ ] **Self-hosted** (e.g., AWS EC2, DigitalOcean)
  - [ ] Deploy `dist/` folder
  - [ ] Set up web server (nginx/Apache)
  - [ ] Enable HTTPS
  - [ ] Set environment variables
  - [ ] Test from outside IP

### 🌐 Domain & DNS
- [ ] Register domain (if not already done)
- [ ] Point DNS to hosting provider
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify domain resolves correctly
- [ ] Set up HTTPS certificate (auto with Vercel/Netlify)

### 🔗 Environment Variables on Host
- [ ] Set `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_ANON_KEY`
- [ ] Verify they're not exposed in HTML
- [ ] Test live site loads without errors

### 🚀 Deploy
- [ ] Push code to production branch
- [ ] Trigger deployment
- [ ] Monitor deployment logs
- [ ] Verify build succeeds
- [ ] Check app loads at live URL

### ✅ Post-Deployment Testing
- [ ] App loads at live domain
- [ ] Sign up works
- [ ] Report creation works
- [ ] Photos upload successfully
- [ ] Map renders correctly
- [ ] Upvoting works
- [ ] Status updates sync
- [ ] Notifications appear
- [ ] Staff dashboard loads

### 📞 User Onboarding
- [ ] Create admin account
- [ ] Create test staff accounts
- [ ] Create test citizen accounts
- [ ] Generate sample data (optional)
- [ ] Write user guide
- [ ] Set up feedback mechanism

### 📈 Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor uptime (e.g., UptimeRobot)
- [ ] Monitor database performance
- [ ] Monitor storage usage
- [ ] Set up alerts for failures

## Post-Launch

### 🎯 Marketing
- [ ] Announce launch
- [ ] Share with target users
- [ ] Get feedback
- [ ] Iterate on issues

### 🔄 Maintenance
- [ ] Daily: Check for errors
- [ ] Weekly: Review analytics
- [ ] Monthly: Backup database
- [ ] Monthly: Review SQL performance queries
- [ ] Quarterly: Update dependencies

### 📊 Growth Metrics
Track these to measure success:
- [ ] Total users
- [ ] Issues reported
- [ ] Average upvotes per issue
- [ ] Time to resolution
- [ ] Staff team satisfaction
- [ ] Citizen satisfaction

---

## Troubleshooting Checklist

If something breaks, check:

**Can't connect to database?**
- [ ] Supabase project exists
- [ ] URL is correct in `.env.local`
- [ ] API key is correct
- [ ] Network not blocked

**Photos not uploading?**
- [ ] Storage bucket exists
- [ ] Bucket is public
- [ ] Bucket named `issue-photos`
- [ ] File size not exceeding limit

**Real-time not working?**
- [ ] Realtime enabled in Supabase settings
- [ ] Check browser console for errors
- [ ] Try hard refresh (Cmd+Shift+R)

**Build fails?**
- [ ] Check `npm run lint` output
- [ ] Ensure all imports are correct
- [ ] Check Node.js version (should be 16+)

**Env vars not loading?**
- [ ] Restart dev server
- [ ] Verify `.env.local` syntax (no spaces)
- [ ] Env vars prefixed with `VITE_` for Vite

---

**Status**: ⚪ Not Started | 🟡 In Progress | 🟢 Complete

Mark items with 🟢 as you complete them!
