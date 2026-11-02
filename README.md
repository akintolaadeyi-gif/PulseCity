# PulseCity 🏙️

> Democratizing civic infrastructure reporting. Citizens report, communities amplify, authorities act.

PulseCity transforms how communities report and resolve infrastructure issues. Instead of complaints disappearing into bureaucracy, citizens can post geotagged photos of problems (potholes, broken lights, flooding, etc.), other residents upvote duplicates to amplify the signal, and staff dispatch teams to fix them with full visibility.

**Status**: Open → Verified → Assigned → In Progress → Completed — full transparency every step of the way.

## Quick Start

See [SETUP.md](./SETUP.md) for complete setup instructions.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 and sign up.

## Core Features

### For Citizens
- 📸 Report issues with geotagged photos
- 🗺️ View all reports on an interactive map
- 👍 Upvote duplicate issues to strengthen signal
- 📊 Track status of your reports in real-time
- 💬 Comment and discuss with community

### For Staff/Admins
- 📋 Dashboard with analytics (issues by category)
- 🎯 Filter and prioritize issues
- 🚗 Assign issues to team members
- 📈 Track team productivity
- 🔔 Get notified when assigned new work

## Technology Stack

- **React 19** — UI framework
- **Vite** — Lightning-fast dev server
- **Google Maps API** — Geotagging & visualization
- **Supabase** — PostgreSQL + Auth + Storage
- **Recharts** — Analytics visualizations

## Architecture

```
Frontend (React + Vite)
    ↓
Supabase Auth
    ↓
PostgreSQL (issues, votes, comments, notifications)
    ↓
Supabase Storage (photos)
```

### Database Schema

**Key Tables**:
- `profiles` — user roles (citizen/staff/admin)
- `issues` — reports with location, photo, status
- `votes` — upvote/downvote tracking (one per user per issue)
- `comments` — discussion threads
- `status_history` — timeline of changes
- `notifications` — real-time alerts

See [SETUP.md](./SETUP.md#database-schema) for full schema details.

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Self-hosted
```bash
npm run build
# Serve dist/ folder with any web server
```

## Environment Variables

```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

## Contributing

This project is actively developed. Ideas, bug reports, and PRs welcome!

## License

Open source under MIT.
