import React, { useState } from 'react';
import { generateMeeting, quickGenerateMeeting } from '../services/api';

const EXAMPLE_PROMPTS = [
  "Schedule a meeting with John tomorrow at 2pm EST",
  "Create a team standup daily at 10am for 30 minutes",
  "Set up a call with the marketing team next Monday at 3pm PST"
];

export default function MeetingForm({ onSuccess, onError }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickLink, setQuickLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || isLoading || isQuickLoading) return;

    setIsLoading(true);
    try {
      const result = await generateMeeting(prompt);
      onSuccess(result);
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickGenerateTop() {
    if (isLoading || isQuickLoading) return;
    
    setIsQuickLoading(true);
    setQuickLink('');
    setIsCopied(false);
    try {
      const result = await quickGenerateMeeting();
      if (result && result.meetLink) {
        setQuickLink(result.meetLink);
      } else {
        throw new Error('No meeting link returned');
      }
    } catch (error) {
      onError(error);
    } finally {
      setIsQuickLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!quickLink) return;
    navigator.clipboard.writeText(quickLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  function handleExampleClick(example) {
    setPrompt(example);
  }

  return (
    <div className="meeting-form">
      {/* Quick Link Section at the Top */}
      <div className="quick-action-card">
        <div className="quick-action-header">
          <span className="quick-tag">⚡ Quick Link</span>
          <button 
            type="button" 
            className="quick-gen-btn"
            onClick={handleQuickGenerateTop}
            disabled={isQuickLoading || isLoading}
          >
            {isQuickLoading ? 'Generating...' : 'Create Instant Meeting'}
          </button>
        </div>
        
        {quickLink && (
          <div className="quick-result-area animate-fade-in">
            <div className="link-display">
              <span className="link-text">{quickLink}</span>
              <button 
                className={`mini-copy-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="divider-with-text">
        <span>or create scheduled meeting</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt">Describe your meeting</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Schedule a meeting with my US team tomorrow at 9am their time and generate Google Meet..."
            rows={4}
            disabled={isLoading || isQuickLoading}
            maxLength={1000}
          />
          <div className="char-count">
            {prompt.length}/1000
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={!prompt.trim() || isLoading || isQuickLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-small"></span>
              Processing AI...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Meeting
            </>
          )}
        </button>
      </form>

      <div className="examples">
        <p className="examples-label">Try an example:</p>
        <div className="example-chips">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              type="button"
              className="example-chip"
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
            >
              {example.length > 40 ? example.substring(0, 40) + '...' : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
