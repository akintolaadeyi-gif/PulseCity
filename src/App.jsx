import MapView from './MapView';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './App.css';

const ABUJA_CENTER = { lat: 9.0765, lng: 7.3986 };

const CATEGORIES = [
  { id: 'pothole', label: 'Pothole', emoji: '🔴', color: '#e63946' },
  { id: 'flood', label: 'Flood', emoji: '🟠', color: '#f4a261' },
  { id: 'fixed_road', label: 'Fixed Road', emoji: '🟢', color: '#2a9d8f' },
  { id: 'water', label: 'Water Issue', emoji: '🔵', color: '#457b9d' },
  { id: 'electricity', label: 'Electricity', emoji: '🟣', color: '#9b5de5' },
  { id: 'school', label: 'School', emoji: '⚫', color: '#343a40' },
];


const STATUSES = ['open', 'verified', 'assigned', 'in-progress', 'completed'];

const STATUS_LABELS = {
  open: 'Created',
  verified: 'Verified',
  assigned: 'Assigned',
  'in-progress': 'Repair Started',
  completed: 'Completed',
};

const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
const getPinColor = (id) => getCategory(id)?.color || '#777777';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('citizen');
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [votedIssues, setVotedIssues] = useState(new Set());
  const [timeline, setTimeline] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState('all');

  // Admin-specific state
  const [staffMembers, setStaffMembers] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterAssignedStaff, setFilterAssignedStaff] = useState('all');
  const [chartData, setChartData] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        setUserRole(profile?.role || 'citizen');
      }
      setLoading(false);
    };
    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  // Fetch notifications and subscribe to real-time
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(data || []);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Fetch staff members if admin
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'staff') return;

    const fetchStaff = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, department')
        .in('role', ['staff', 'admin']);
      setStaffMembers(data || []);
    };

    fetchStaff();
  }, [userRole]);

  // Fetch issues with filters
  useEffect(() => {
    if (!user) return;

    const fetchIssues = async () => {
      let query = supabase.from('issues').select('*');

      // All users see all issues (for upvoting duplicates and tracking)
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      // Staff-only filters
      if (userRole === 'admin' || userRole === 'staff') {
        if (filterAssignedStaff !== 'all') {
          query = query.eq('assigned_staff_id', filterAssignedStaff);
        }
        if (filterDateRange === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query = query.gte('created_at', sevenDaysAgo.toISOString());
        } else if (filterDateRange === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('created_at', thirtyDaysAgo.toISOString());
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        setIssues(data);
        if (userRole === 'admin' || userRole === 'staff') {
          const categoryCount = {};
          CATEGORIES.forEach((cat) => {
            categoryCount[cat.id] = 0;
          });
          data.forEach((issue) => {
            if (categoryCount[issue.category] !== undefined) {
              categoryCount[issue.category]++;
            }
          });
          const chartData = CATEGORIES.map((cat) => ({
            name: cat.label,
            count: categoryCount[cat.id],
            color: cat.color,
          }));
          setChartData(chartData);
        }
      }
    };

    fetchIssues();

    const channel = supabase
      .channel('issues-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIssues((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setIssues((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)));
          if (selected && selected.id === payload.new.id) setSelected(payload.new);
        } else if (payload.eventType === 'DELETE') {
          setIssues((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, userRole, filterCategory, filterStatus, filterDateRange, filterAssignedStaff]);

  useEffect(() => {
    if (!selected) return;

    const fetchTimeline = async () => {
      const { data } = await supabase
        .from('status_history')
        .select('*')
        .eq('issue_id', selected.id)
        .order('changed_at', { ascending: true });
      if (data) setTimeline(data);
    };

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('issue_id', selected.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    };

    fetchTimeline();
    fetchComments();

    const channel = supabase
      .channel(`comments-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `issue_id=eq.${selected.id}` }, (payload) => {
        setComments((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selected]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthError('Check your email to confirm signup!');
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (issueId) => {
    if (!photoFile) return null;

    setUploadingPhoto(true);
    const fileExt = photoFile.name.split('.').pop();
    const filePath = `${issueId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('issue-photos').upload(filePath, photoFile);
    setUploadingPhoto(false);

    if (error) {
      console.error('Photo upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('issue-photos').getPublicUrl(filePath);
    return data?.publicUrl;
  };

  const handleMapClick = (location) => {
    if (!isReporting || !selectedCategory) return;
    setPendingLocation(location);
  };

  const handleStartReport = () => {
    setSelected(null);
    setIsReporting(true);
    setSelectedCategory(null);
    setPendingLocation(null);
    setNewTitle('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleCancelReport = () => {
    setIsReporting(false);
    setSelectedCategory(null);
    setPendingLocation(null);
    setNewTitle('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !pendingLocation || !selectedCategory) return;

    let photoUrl = null;

    const { data: issueData, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: newTitle.trim(),
        category: selectedCategory,
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        status: 'open',
        user_id: user.id,
      })
      .select()
      .single();

    if (issueError) {
      console.error('Error submitting issue:', issueError);
      return;
    }

    if (photoFile) {
      photoUrl = await uploadPhoto(issueData.id);
      if (photoUrl) {
        await supabase.from('issues').update({ photo_url: photoUrl }).eq('id', issueData.id);
      }
    }

    await supabase.from('status_history').insert({
      issue_id: issueData.id,
      status: 'open',
    });

    setSelected(issueData);
    setIsReporting(false);
    setSelectedCategory(null);
    setPendingLocation(null);
    setNewTitle('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;

    await supabase.from('issues').update({ status: newStatus }).eq('id', selected.id);
    await supabase.from('status_history').insert({ issue_id: selected.id, status: newStatus });

    const updated = { ...selected, status: newStatus };
    setSelected(updated);
    setIssues((prev) => prev.map((i) => (i.id === selected.id ? updated : i)));

    const { data } = await supabase
      .from('status_history')
      .select('*')
      .eq('issue_id', selected.id)
      .order('changed_at', { ascending: true });
    if (data) setTimeline(data);
  };

  const handleAssignStaff = async (staffId) => {
    if (!selected) return;

    await supabase.from('issues').update({ assigned_staff_id: staffId }).eq('id', selected.id);

    // Create notification for assigned staff
    if (staffId) {
      await supabase.from('notifications').insert({
        user_id: staffId,
        issue_id: selected.id,
        type: 'assigned',
        title: 'New Issue Assigned',
        message: `Issue "${selected.title}" has been assigned to you`,
      });
    }

    const updated = { ...selected, assigned_staff_id: staffId };
    setSelected(updated);
    setIssues((prev) => prev.map((i) => (i.id === selected.id ? updated : i)));
  };

  const handleVote = async (issueId, voteType) => {
    if (votedIssues.has(issueId)) return;

    await supabase.from('votes').insert({
      issue_id: issueId,
      voter_fingerprint: user.id,
      vote_type: voteType,
    });

    setVotedIssues((prev) => new Set([...prev, issueId]));
    setIssues((prev) =>
      prev.map((i) => {
        if (i.id === issueId) {
          return {
            ...i,
            votes_up: (i.votes_up || 0) + (voteType === 'up' ? 1 : 0),
            votes_down: (i.votes_down || 0) + (voteType === 'down' ? 1 : 0),
          };
        }
        return i;
      })
    );

    if (selected?.id === issueId) {
      setSelected((prev) => ({
        ...prev,
        votes_up: (prev.votes_up || 0) + (voteType === 'up' ? 1 : 0),
        votes_down: (prev.votes_down || 0) + (voteType === 'down' ? 1 : 0),
      }));
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selected) return;

    await supabase.from('comments').insert({
      issue_id: selected.id,
      body: newComment.trim(),
    });

    setNewComment('');
  };

  const markNotificationAsRead = async (notificationId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };


  if (loading) return <div className="app"><p>Loading...</p></div>;

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>PulseCity</h1>
          <p>Report & track community issues</p>

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {authError && <p className="auth-error">{authError}</p>}

          <p className="auth-toggle">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError('');
              }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <div className="map-area">
        <MapView
          center={ABUJA_CENTER}
          zoom={13}
          issues={issues}
          getColor={getPinColor}
          onSelect={setSelected}
          onMapClick={handleMapClick}
          pendingLocation={pendingLocation}
        />
          <div className="map-legend" aria-label="Map legend">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="legend-item">
                <span className="legend-dot" style={{ background: cat.color }} />
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-header">
            <div>
              <h1>PulseCity</h1>
              <p>{userRole === 'admin' || userRole === 'staff' ? 'Admin Dashboard' : 'Report & track issues'}</p>
            </div>
            <div className="header-actions">
              {(userRole === 'admin' || userRole === 'staff') && (
                <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                  🔔
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
              )}
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (userRole === 'admin' || userRole === 'staff') && (
            <div className="notifications-dropdown">
              <h4>Notifications</h4>
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications yet</p>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`} onClick={() => markNotificationAsRead(notif.id)}>
                      <p className="notif-title">{notif.title}</p>
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">
                        {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Dashboard */}
          {(userRole === 'admin' || userRole === 'staff') && !isReporting && !selected && (
            <div className="admin-dashboard">
              <h3>Dashboard</h3>

              <div className="analytics-section">
                <h4>Issues by Category</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} interval={0} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="filter-section">
                <h4>Filters</h4>

                <label>Category:</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>

                <label>Status:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>

                <label>Date Range:</label>
                <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>

                <label>Assigned Staff:</label>
                <select value={filterAssignedStaff} onChange={(e) => setFilterAssignedStaff(e.target.value)}>
                  <option value="all">All (Assigned & Unassigned)</option>
                  <option value="null">Unassigned</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.email}
                    </option>
                  ))}
                </select>
              </div>

              <p className="issue-count">Total: {issues.length} issues</p>
            </div>
          )}

        {userRole === 'citizen' && !isReporting && !selected && (
            <>
              <div className="view-tabs">
                <button
                  className={`tab ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => setViewMode('all')}
                >
                  All Issues
                </button>
                <button
                  className={`tab ${viewMode === 'my-issues' ? 'active' : ''}`}
                  onClick={() => setViewMode('my-issues')}
                >
                  My Issues
                </button>
              </div>
              <button onClick={handleStartReport}>+ Report an Issue</button>
            </>
          )}

          {isReporting && (
            <div className="report-form">
              {!selectedCategory && (
                <>
                  <p className="report-instructions">Choose a category for this issue.</p>
                  <div className="category-grid">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className="category-btn"
                        onClick={() => handleSelectCategory(cat.id)}
                      >
                        <span className="category-emoji">{cat.emoji}</span>
                        <span className="category-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  <button className="secondary" onClick={handleCancelReport}>
                    Cancel
                  </button>
                </>
              )}

              {selectedCategory && !pendingLocation && (
                <>
                  <p className="report-instructions">
                    Category: {getCategory(selectedCategory)?.emoji} {getCategory(selectedCategory)?.label}
                    <br />
                    Click anywhere on the map to drop a pin for the issue location.
                  </p>
                  <button className="secondary" onClick={handleCancelReport}>
                    Cancel
                  </button>
                </>
              )}

              {selectedCategory && pendingLocation && (
                <form onSubmit={handleSubmitReport}>
                  <p className="report-instructions">
                    Category: {getCategory(selectedCategory)?.emoji} {getCategory(selectedCategory)?.label}
                    <br />
                    Pin dropped. Describe the issue below.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Pothole on 3rd Avenue"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                  />

                  <div className="photo-upload">
                    <label>
                      📷 Attach Photo (optional)
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} />
                    </label>
                    {photoPreview && <img src={photoPreview} alt="preview" className="photo-preview" />}
                  </div>

                  <div className="report-form-actions">
                    <button type="submit" disabled={uploadingPhoto}>
                      {uploadingPhoto ? 'Uploading...' : 'Submit'}
                    </button>
                    <button type="button" className="secondary" onClick={handleCancelReport}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {selected ? (
            <div className="issue-card">
              <h3>{getCategory(selected.category)?.emoji} {selected.title}</h3>
              <p className="issue-owner">
                {selected.user_id === user.id ? '(Your report)' : `(Citizen report)`}
              </p>

              {selected.photo_url && (
                <img src={selected.photo_url} alt="issue" className="issue-photo" />
              )}

              {(userRole === 'admin' || userRole === 'staff') && (
                <div className="assign-section">
                  <label>Assign to Staff:</label>
                  <select value={selected.assigned_staff_id || 'none'} onChange={(e) => handleAssignStaff(e.target.value === 'none' ? null : e.target.value)}>
                    <option value="none">Unassigned</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.email}
                      </option>
                    ))}
                  </select>
                  {selected.assigned_staff_id && (
                    <p className="assigned-text">
                      ✅ Assigned to: {staffMembers.find((s) => s.id === selected.assigned_staff_id)?.email}
                    </p>
                  )}
                </div>
              )}

              <div className="status-section">
                <label>Status:</label>
                <select value={selected.status} onChange={(e) => handleStatusChange(e.target.value)} className="status-select">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vote-section">
                <button
                  className={`vote-btn ${votedIssues.has(selected.id) ? 'disabled' : ''}`}
                  onClick={() => handleVote(selected.id, 'up')}
                  disabled={votedIssues.has(selected.id)}
                >
                  👍 {selected.votes_up ?? 0}
                </button>
                <button
                  className={`vote-btn ${votedIssues.has(selected.id) ? 'disabled' : ''}`}
                  onClick={() => handleVote(selected.id, 'down')}
                  disabled={votedIssues.has(selected.id)}
                >
                  👎 {selected.votes_down ?? 0}
                </button>
              </div>

              {timeline.length > 0 && (
                <div className="timeline">
                  <h4>Timeline</h4>
                  {timeline.map((entry, idx) => (
                    <div key={idx} className="timeline-entry">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <span className="timeline-status">{STATUS_LABELS[entry.status]}</span>
                        <span className="timeline-date">
                          {new Date(entry.changed_at).toLocaleDateString()} {new Date(entry.changed_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="comments-section">
                <h4>Discussion</h4>
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">No comments yet. Be the first!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <p className="comment-body">{comment.body}</p>
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSubmitComment} className="comment-form">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit">Comment</button>
                </form>
              </div>

              <button onClick={() => setSelected(null)}>Close</button>
            </div>
          ) : (
            !isReporting && (
              <div className="issues-list">
                <h3>Issues</h3>
                {(() => {
                  const filteredIssues = viewMode === 'my-issues' 
                    ? issues.filter(i => i.user_id === user.id)
                    : issues;
                  return filteredIssues.length === 0 ? (
                    <p className="no-issues">No issues yet.</p>
                  ) : (
                    filteredIssues.map((issue) => (
                      <div key={issue.id} className="issue-item" onClick={() => setSelected(issue)}>
                        <p>
                          <strong>{getCategory(issue.category)?.emoji} {issue.title}</strong>
                        </p>
                        <p className={`status ${issue.status}`}>{issue.status}</p>
                      </div>
                    ))
                  );
                })()}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}