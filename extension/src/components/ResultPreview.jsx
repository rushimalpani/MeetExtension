import React, { useState } from 'react';
import CopyButtons from './CopyButtons';

const PLATFORM_STYLES = {
  google_meet: { name: 'Google Meet', icon: '/Gmeeticon.png', color: '#00897B' },
  microsoft_teams: { name: 'Teams', icon: '/teamicon.png', color: '#6264A7' },
  zoom: { name: 'Zoom', icon: '/zoomicon.png', color: '#2D8CFF' }
};

export default function ResultPreview({ result, onBack }) {
  const [activeTab, setActiveTab] = useState('details');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  
  const { meeting, times, meetLink, email, calendar, platform } = result;
  
  // Get platform info - use from result or default to google_meet
  const platformId = platform?.id || 'google_meet';
  const platformStyle = PLATFORM_STYLES[platformId] || PLATFORM_STYLES.google_meet;

  const handleSendGmail = () => {
    const subject = encodeURIComponent(email.subject);
    const body = encodeURIComponent(email.body);
    let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${subject}&body=${body}`;
    if (ccEmail) gmailUrl += `&cc=${encodeURIComponent(ccEmail)}`;
    if (bccEmail) gmailUrl += `&bcc=${encodeURIComponent(bccEmail)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleSendOutlook = () => {
    const subject = encodeURIComponent(email.subject);
    const body = encodeURIComponent(email.body);
    let outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(recipientEmail)}&subject=${subject}&body=${body}`;
    if (ccEmail) outlookUrl += `&cc=${encodeURIComponent(ccEmail)}`;
    if (bccEmail) outlookUrl += `&bcc=${encodeURIComponent(bccEmail)}`;
    window.open(outlookUrl, '_blank');
  };

  return (
    <div className="result-preview">
      <button onClick={onBack} className="back-btn">
        ← Back
      </button>

      <div className="result-header">
        <h2>{meeting.title}</h2>
        {calendar?.created && (
          <span className="calendar-badge">✓ Added to Calendar</span>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          📋 Details
        </button>
        <button 
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          ✉️ Email
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' ? (
          <div className="details-tab">
            <div className="detail-card">
              <div className="detail-row">
                <span className="detail-icon">📅</span>
                <div className="detail-info">
                  <label>Date</label>
                  <span>{meeting.date}</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-icon">🌍</span>
                <div className="detail-info">
                  <label>Their Time ({times.foreign.timezone})</label>
                  <span>{times.foreign.formatted}</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-icon">🏠</span>
                <div className="detail-info">
                  <label>Your Time ({times.local.timezone})</label>
                  <span>{times.local.formatted}</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-icon">⏱️</span>
                <div className="detail-info">
                  <label>Duration</label>
                  <span>{meeting.duration} minutes</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-icon">👥</span>
                <div className="detail-info">
                  <label>Participants</label>
                  <span>{meeting.participants || 'Not specified'}</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-icon">📝</span>
                <div className="detail-info">
                  <label>Purpose</label>
                  <span>{meeting.purpose}</span>
                </div>
              </div>
            </div>

            {meetLink && (
              <div 
                className="meet-link-card"
                style={{ '--platform-color': platformStyle.color }}
              >
                <div className="meet-header">
                  <img src={platformStyle.icon} alt={platformStyle.name} className="meet-icon-img" />
                  <span>{platformStyle.name}</span>
                </div>
                <a 
                  href={meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="meet-link"
                >
                  {meetLink}
                </a>
                <CopyButtons text={meetLink} label="Copy Link" />
              </div>
            )}

            {calendar?.eventLink && (
              <a 
                href={calendar.eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="calendar-link-btn"
              >
                📅 Open in Google Calendar
              </a>
            )}
          </div>
        ) : (
          <div className="email-tab">
            <div className="email-sender-form">
              <label htmlFor="recipient">To (separate multiple with commas):</label>
              <input 
                type="text" 
                id="recipient"
                placeholder="e.g., john@example.com, jane@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="recipient-input"
              />
              
              <label htmlFor="cc">CC:</label>
              <input 
                type="text" 
                id="cc"
                placeholder="e.g., manager@example.com"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                className="recipient-input"
              />
              
              <label htmlFor="bcc">BCC:</label>
              <input 
                type="text" 
                id="bcc"
                placeholder="e.g., teamlead@example.com"
                value={bccEmail}
                onChange={(e) => setBccEmail(e.target.value)}
                className="recipient-input"
              />
              
              <div className="direct-send-buttons">
                <button onClick={handleSendGmail} className="gmail-btn">
                  <span className="btn-icon">📧</span> Gmail
                </button>
                <button onClick={handleSendOutlook} className="outlook-btn">
                  <span className="btn-icon">📬</span> Outlook
                </button>
              </div>
            </div>

            <div className="email-preview">
              <div className="email-subject">
                <label>Subject:</label>
                <p>{email.subject}</p>
              </div>
              <div className="email-body">
                <label>Body:</label>
                <pre>{email.body}</pre>
              </div>
            </div>
            <CopyButtons 
              text={`Subject: ${email.subject}\n\n${email.body}`}
              label="Copy Email"
            />
          </div>
        )}
      </div>
    </div>
  );
}
