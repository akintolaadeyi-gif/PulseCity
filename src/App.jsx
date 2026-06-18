import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';
import { useState } from 'react';
import './App.css';

const ABUJA_CENTER = { lat: 9.0765, lng: 7.3986 };

const SAMPLE_ISSUES = [
  { id: 1, lat: 9.0765, lng: 7.3986, title: 'Pothole on Lekki-Epe Road', status: 'open', votes: 24 },
  { id: 2, lat: 9.0865, lng: 7.4086, title: 'Broken Traffic Light', status: 'in-progress', votes: 15 },
  { id: 3, lat: 9.0665, lng: 7.3886, title: 'Overflowing Waste Bin', status: 'open', votes: 8 },
];

export default function App() {
  const [issues, setIssues] = useState(SAMPLE_ISSUES);
  const [selected, setSelected] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleMapClick = (e) => {
    if (!isReporting) return;
    setPendingLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  const handleStartReport = () => {
    setSelected(null);
    setIsReporting(true);
    setPendingLocation(null);
    setNewTitle('');
  };

  const handleCancelReport = () => {
    setIsReporting(false);
    setPendingLocation(null);
    setNewTitle('');
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !pendingLocation) return;

    const nextId = issues.length ? Math.max(...issues.map((i) => i.id)) + 1 : 1;
    const newIssue = {
      id: nextId,
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      title: newTitle.trim(),
      status: 'open',
      votes: 0,
    };

    setIssues([newIssue, ...issues]);
    setSelected(newIssue);
    setIsReporting(false);
    setPendingLocation(null);
    setNewTitle('');
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="app">
        <GoogleMap
          mapContainerClassName="map"
          center={ABUJA_CENTER}
          zoom={13}
          onClick={handleMapClick}
        >
          {issues.map((issue) => (
            <MarkerF
              key={issue.id}
              position={{ lat: issue.lat, lng: issue.lng }}
              onClick={() => setSelected(issue)}
              title={issue.title}
            />
          ))}

          {pendingLocation && (
            <MarkerF position={pendingLocation} label="📍" />
          )}
        </GoogleMap>

        <div className="sidebar">
          <h1>PulseCity</h1>
          <p>Report & track community issues</p>

          {!isReporting && (
            <button onClick={handleStartReport}>+ Report an Issue</button>
          )}

          {isReporting && (
            <div className="report-form">
              <p className="report-instructions">
                {pendingLocation
                  ? 'Pin dropped. Describe the issue below.'
                  : 'Click anywhere on the map to drop a pin for the issue location.'}
              </p>

              {pendingLocation ? (
                <form onSubmit={handleSubmitReport}>
                  <input
                    type="text"
                    placeholder="e.g. Pothole on 3rd Avenue"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="report-form-actions">
                    <button type="submit">Submit</button>
                    <button type="button" className="secondary" onClick={handleCancelReport}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button className="secondary" onClick={handleCancelReport}>
                  Cancel
                </button>
              )}
            </div>
          )}

          {selected ? (
            <div className="issue-card">
              <h3>{selected.title}</h3>
              <p>Status: <span className={`status ${selected.status}`}>{selected.status}</span></p>
              <p>👍 {selected.votes} votes</p>
              <button onClick={() => setSelected(null)}>Close</button>
            </div>
          ) : (
            !isReporting && (
              <div className="issues-list">
                <h3>Nearby Issues</h3>
                {issues.map((issue) => (
                  <div key={issue.id} className="issue-item" onClick={() => setSelected(issue)}>
                    <p><strong>{issue.title}</strong></p>
                    <p className={`status ${issue.status}`}>{issue.status}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </LoadScript>
  );
}