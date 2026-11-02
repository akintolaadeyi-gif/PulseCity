# PulseCity Setup Guide

## Overview
PulseCity is a citizen-powered civic infrastructure reporting platform. Citizens report issues (potholes, floods, etc.) with photos and locations. Community members upvote duplicates to amplify signals. Staff/admins track and resolve issues.

## Prerequisites
- Node.js 16+
- A Supabase account (free at supabase.com)
- Google Maps API key (already configured)

## Setup Steps

### 1. Supabase Database Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing with project ID: `rxiuhtqntibvglmtgefh`)
3. Copy your **Project URL** and **Anon Key** (should match `.env.local`)
4. Go to **SQL Editor** and paste the entire contents of `supabase/migrations/001_init_pulsecity_schema.sql`
5. Click **Run** to execute the schema

### 2. Storage Bucket Setup
1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `issue-photos`
4. Set visibility to **Public**
5. Click **Create**

### 3. Authentication Setup
1. In Supabase, go to **Authentication > Providers**
2. Ensure **Email** provider is enabled (default)
3. Go to **URL Configuration** and add your app's redirect URL

### 4. Install & Run
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

### Tables

#### `profiles`
- Extends Supabase auth.users
- Stores: role (citizen/staff/admin), department
- Auto-created when user signs up

#### `issues`
- Core issue reports
- Fields: title, category, lat, lng, city, status, photo_url, user_id, assigned_staff_id, votes_up, votes_down
- Categories: pothole, flood, fixed_road, water, electricity, school
- Statuses: open → verified → assigned → in-progress → completed

#### `votes`
- One vote per user per issue (enforced by UNIQUE constraint)
- vote_type: 'up' or 'down'
- Automatically updates votes_up/votes_down on issues table

#### `comments`
- Discussion on issues
- Linked to issue_id and user_id

#### `status_history`
- Timeline of issue status changes
- Useful for tracking progress and history

#### `notifications`
- Real-time notifications for staff
- Types: assigned, status_update, comment, vote, verification

### Indexes
Created on: user_id, category, status, assigned_staff_id, city, created_at for fast queries

## User Roles

### Citizen
- ✅ Report new issues with photo
- ✅ View all issues on map
- ✅ Upvote/downvote duplicate issues (one vote per user)
- ✅ Track status of their reports
- ✅ Comment on issues
- ✅ Filter "My Issues" vs "All Issues"

### Staff
- ✅ View all issues + admin dashboard
- ✅ Assign issues to themselves
- ✅ Update issue status (verified, assigned, in-progress, completed)
- ✅ See analytics (issues by category)
- ✅ Filter by category, status, date range, assigned staff
- ✅ Receive notifications when assigned

### Admin
- ✅ All staff permissions
- ✅ Assign issues to any staff member
- ✅ Manage staff

## Features

### Citizen Workflow
1. Sign up / Log in
2. Click "+ Report an Issue"
3. Choose category
4. Click on map to set location
5. Add title and optional photo
6. Submit
7. View issue on map and sidebar
8. Upvote duplicates to strengthen signal
9. Track status changes in timeline
10. Comment to provide updates

### Staff Workflow
1. Log in as staff (must be assigned role in database)
2. See admin dashboard with analytics
3. Filter issues by category/status/date/staff
4. Click issue to view details
5. Assign to yourself or team
6. Update status as you progress
7. Receive notifications for new assignments

## Environment Variables

Already configured in `.env.local`:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBmV2pUQQDroylGnW0lvij7zsH32v79anI
VITE_SUPABASE_URL=https://rxiuhtqntibvglmtgefh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GSb_jZqcAcQc7VjOPunusg_Ql3x1o3I
```

## Tech Stack
- **Frontend**: React 19 + Vite
- **Maps**: Google Maps API
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## Known Limitations
- Single city (Abuja) for now — city field ready for multi-city expansion
- Staff assignment is basic — authority routing can be enhanced
- No email notifications yet (in-app only)

## Future Enhancements
- [ ] Multi-city support
- [ ] Email/SMS notifications to authorities
- [ ] Automatic category routing to right department
- [ ] Mobile app
- [ ] Integration with municipal systems
- [ ] Gamification (badges, leaderboards)
- [ ] Advanced analytics dashboard
