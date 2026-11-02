-- PulseCity Admin SQL Queries
-- Run these in Supabase SQL Editor for insights and management

-- 1. ANALYTICS & REPORTING

-- Issues count by status
SELECT status, COUNT(*) as count
FROM issues
GROUP BY status
ORDER BY count DESC;

-- Issues count by category
SELECT category, COUNT(*) as count, AVG(votes_up) as avg_upvotes
FROM issues
GROUP BY category
ORDER BY count DESC;

-- Most upvoted issues (trending)
SELECT id, title, category, votes_up, votes_down, status
FROM issues
WHERE votes_up > 0
ORDER BY votes_up DESC
LIMIT 10;

-- Issues by date (past 7 days)
SELECT DATE(created_at) as date, COUNT(*) as count
FROM issues
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Staff workload
SELECT 
  p.email,
  COUNT(i.id) as assigned_issues,
  COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed
FROM profiles p
LEFT JOIN issues i ON p.id = i.assigned_staff_id
WHERE p.role = 'staff'
GROUP BY p.id, p.email
ORDER BY assigned_issues DESC;

-- Average time to resolve (by category)
SELECT 
  i.category,
  AVG(EXTRACT(DAY FROM i.updated_at - i.created_at)) as avg_days
FROM issues i
WHERE i.status = 'completed'
GROUP BY i.category
ORDER BY avg_days DESC;

-- 2. MANAGEMENT & MAINTENANCE

-- Promote citizen to staff
UPDATE profiles
SET role = 'staff', department = 'Public Works'
WHERE email = 'staff@example.com';

-- Bulk reassign issues from one staff to another
UPDATE issues
SET assigned_staff_id = 'new-staff-uuid'
WHERE assigned_staff_id = 'old-staff-uuid';

-- Reset all unassigned issues to 'open' status
UPDATE issues
SET status = 'open'
WHERE status = 'verified' AND assigned_staff_id IS NULL;

-- Close old unaddressed issues (older than 30 days, still open)
SELECT id, title, created_at
FROM issues
WHERE status = 'open'
AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at;

-- 3. QUALITY & MODERATION

-- Issues with no upvotes (potential spam/duplicates)
SELECT id, title, category, created_at, user_id
FROM issues
WHERE votes_up = 0 AND votes_down = 0
AND created_at > NOW() - INTERVAL '3 days'
ORDER BY created_at DESC;

-- Users with most reported issues
SELECT user_id, COUNT(*) as issue_count
FROM issues
GROUP BY user_id
ORDER BY issue_count DESC
LIMIT 10;

-- Most commented issues
SELECT i.id, i.title, COUNT(c.id) as comment_count
FROM issues i
LEFT JOIN comments c ON i.id = c.issue_id
GROUP BY i.id
ORDER BY comment_count DESC
LIMIT 10;

-- 4. NOTIFICATIONS & ALERTS

-- Unread notifications for specific staff
SELECT *
FROM notifications
WHERE user_id = 'staff-uuid' AND read = false
ORDER BY created_at DESC;

-- Mark all notifications as read
UPDATE notifications
SET read = true
WHERE user_id = 'staff-uuid' AND read = false;

-- Create manual notification for staff
INSERT INTO notifications (user_id, issue_id, type, title, message)
VALUES (
  'staff-uuid',
  'issue-uuid',
  'status_update',
  'Alert: High-priority flooding',
  'Multiple upvotes on flooding report at Lekki Bridge'
);

-- 5. TROUBLESHOOTING

-- Issues with missing photos
SELECT id, title, created_at, user_id
FROM issues
WHERE photo_url IS NULL
ORDER BY created_at DESC;

-- Broken foreign key references
SELECT i.id, i.title, i.user_id
FROM issues i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE p.id IS NULL;

-- Vote anomalies (same user voting multiple times on same issue)
SELECT issue_id, voter_fingerprint, COUNT(*) as vote_count
FROM votes
GROUP BY issue_id, voter_fingerprint
HAVING COUNT(*) > 1;

-- Comments without associated issues
SELECT c.id, c.body, c.issue_id
FROM comments c
LEFT JOIN issues i ON c.issue_id = i.id
WHERE i.id IS NULL;

-- 6. MULTI-CITY PREP

-- Issues by city
SELECT city, COUNT(*) as count, COUNT(CASE WHEN status = 'completed' THEN 1 END) as resolved
FROM issues
GROUP BY city
ORDER BY count DESC;

-- Add new city
INSERT INTO issues (title, category, lat, lng, city, status, user_id)
VALUES ('Sample Issue', 'pothole', 6.5244, 3.3792, 'Lagos', 'open', 'user-uuid');

-- 7. PERFORMANCE MONITORING

-- Long-running queries (issues taking 30+ days)
SELECT id, title, category, status, AGE(NOW(), created_at) as duration
FROM issues
WHERE status != 'completed'
AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at;

-- Recently created issues (last 24 hours)
SELECT id, title, category, user_id, created_at
FROM issues
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Completed issues rate this week
SELECT 
  COUNT(*) as total_issues,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 2) as completion_rate
FROM issues
WHERE created_at >= NOW() - INTERVAL '7 days';
