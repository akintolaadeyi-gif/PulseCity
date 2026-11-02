# PulseCity Quick Reference

## What Got Done ✅

### 1. Complete Supabase Schema (`supabase/migrations/001_init_pulsecity_schema.sql`)
- **7 tables**: profiles, issues, votes, comments, status_history, notifications
- **Row-Level Security (RLS)**: citizens can't modify others' issues, staff can
- **Triggers**: auto-update vote counts, auto-create user profiles on signup
- **Indexes**: optimized queries on frequently searched columns (category, status, city, date)
- **Storage**: ready for photo uploads to `issue-photos` bucket

### 2. Fixed Citizen View (`src/App.jsx`)
**Before**: Citizens only saw their own issues ❌  
**After**: Citizens see ALL issues by default ✅
- Can upvote/downvote duplicates to amplify signal
- "My Issues" tab filters to see just theirs
- Staff still has dedicated admin dashboard with filters

### 3. Documentation
- **SETUP.md** — Complete setup walkthrough (Supabase, storage, environment)
- **README.md** — Vision, features, tech stack, quick start
- Both files in repo root for easy access

## Next Steps to Go Live

### Step 1: Set Up Supabase (5 mins)
```bash
1. Go to https://supabase.com
2. Create project (or use existing: rxiuhtqntibvglmtgefh)
3. In SQL Editor, paste entire contents of: supabase/migrations/001_init_pulsecity_schema.sql
4. Click Run
5. Go to Storage → Create bucket → Name: issue-photos → Set Public
```

### Step 2: Run the App Locally (2 mins)
```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### Step 3: Test the Full Workflow
```
1. Sign up as citizen@test.com
2. Click "+ Report an Issue"
3. Pick "Pothole" category
4. Click map to set location
5. Add title + photo
6. Submit → Issue appears on map
7. Upvote it (test duplicate detection)
8. Check timeline + comments
9. Sign up as staff@test.com + manually set role='staff' in profiles table
10. See admin dashboard → Assign issue to yourself
11. Change status → Check notifications
```

## File Structure

```
PulseCity/
├── src/
│   ├── App.jsx              ← Main component (862 lines, all features)
│   ├── App.css              ← Styling
│   ├── index.css            ← Global styles
│   ├── main.jsx             ← Entry point
│   └── supabaseClient.js    ← DB connection
├── supabase/
│   ├── migrations/
│   │   └── 001_init_pulsecity_schema.sql  ← Database schema (RUN THIS!)
│   └── config.json          ← Reference config
├── public/                  ← Static files
├── vite.config.js           ← Vite config
├── eslint.config.js         ← Linting
├── package.json
├── README.md                ← Project overview
├── SETUP.md                 ← Detailed setup guide
└── .env.local               ← Env vars (already set)
```

## Key Features Enabled

### Citizen Side
- ✅ Sign up / Login with email
- ✅ Report issue: choose category → click map → add title + photo
- ✅ View all issues on Abuja map
- ✅ Upvote/downvote to signal duplicates (one vote per user per issue)
- ✅ See issue status: open → verified → assigned → in-progress → completed
- ✅ Timeline: see exactly when status changed
- ✅ Comments: discuss and share updates
- ✅ View own reports via "My Issues" tab

### Staff Side
- ✅ Dashboard with analytics (issues by category)
- ✅ Assign issues to self or team
- ✅ Change status as you work
- ✅ Filter by: category, status, date range, assigned staff
- ✅ Notifications when assigned new work

## Database Tables at a Glance

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User data & roles | id, email, role, department |
| `issues` | Reports | id, title, category, lat, lng, status, photo_url, votes_up/down |
| `votes` | Duplicate signals | issue_id, voter_id, vote_type (up/down) |
| `comments` | Discussion | issue_id, user_id, body |
| `status_history` | Timeline | issue_id, status, changed_at |
| `notifications` | Alerts for staff | user_id, issue_id, type, title, read |

## Environment Variables (Already Set)
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmV2pUQQDroylGnW0lvij7zsH32v79anI
VITE_SUPABASE_URL=https://rxiuhtqntibvglmtgefh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GSb_jZqcAcQc7VjOPunusg_Ql3x1o3I
```

## Troubleshooting

### "Table issues does not exist"
→ Run the migration SQL file in Supabase SQL Editor

### Photos not uploading
→ Check that storage bucket `issue-photos` exists and is public

### Votes not working
→ Verify `votes` table has UNIQUE constraint on (issue_id, voter_fingerprint)

### Real-time updates not showing
→ Check that Realtime is enabled in Supabase Project Settings

## What's Ready for Future

- **Multi-city**: `city` field already in issues table
- **Authority routing**: `department` field in profiles for role-based notifications
- **Analytics**: aggregation queries ready for reporting dashboard
- **Mobile**: responsive design already implemented

---

**That's it!** Your platform is ready. Follow the three steps above to go live! 🚀
