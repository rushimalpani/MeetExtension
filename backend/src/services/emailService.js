/**
 * Generate professional email template for meeting invitation
 * @param {Object} meetingData - Parsed meeting data
 * @param {string} meetLink - Google Meet link
 * @param {Object} times - Converted time info
 * @param {string} userName - Sender's name
 * @returns {Object} Email subject and body
 */
function generateEmail(meetingData, meetLink, times, userName = 'Your Name') {
  const { title, date, participants, purpose, duration } = meetingData;

  // Format date nicely
  const formattedDate = formatDateForEmail(date);

  const subject = `Meeting Invitation: ${title} | ${formattedDate}`;

  const body = `Hi ${getFirstNames(participants)},

Hope you are doing well.

This is to inform you that our meeting has been scheduled as follows:

📅 Meeting Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${title}
Date: ${formattedDate}
Your Time: ${times.foreignTime}
My Time: ${times.localTime}
Duration: ${duration} minutes
${meetLink ? `Meeting Link: ${meetLink}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Agenda:
${purpose}

Please let me know if you have any questions or if any changes are required.

Best Regards,
${userName}`;

  // Also generate HTML version
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
    .details p { margin: 8px 0; }
    .meet-link { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .meet-link:hover { background: #5a67d8; }
    .agenda { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">📅 Meeting Invitation</h2>
      <p style="margin:10px 0 0 0; opacity: 0.9;">${title}</p>
    </div>
    <div class="content">
      <p>Hi ${getFirstNames(participants)},</p>
      <p>Hope you are doing well. This is to inform you that our meeting has been scheduled:</p>
      
      <div class="details">
        <p><strong>📆 Date:</strong> ${formattedDate}</p>
        <p><strong>🌍 Your Time:</strong> ${times.foreignTime}</p>
        <p><strong>🏠 My Time:</strong> ${times.localTime}</p>
        <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
      </div>
      
      ${meetLink ? `
      <p style="text-align: center;">
        <a href="${meetLink}" class="meet-link">🎥 Join Google Meet</a>
      </p>
      ` : ''}
      
      <div class="agenda">
        <h3 style="margin-top:0;">📋 Agenda</h3>
        <p>${purpose}</p>
      </div>
      
      <p>Please let me know if you have any questions or if any changes are required.</p>
      
      <div class="footer">
        <p>Best Regards,<br><strong>${userName}</strong></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    body,
    htmlBody
  };
}

/**
 * Format date for email display
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDateForEmail(date) {
  const d = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Extract first names from participants list
 * @param {string} participants - Comma-separated participants
 * @returns {string} First names
 */
function getFirstNames(participants) {
  if (!participants) return 'there';

  const names = participants
    .split(',')
    .map(p => p.trim().split(' ')[0].split('@')[0])
    .filter(Boolean);

  if (names.length === 0) return 'there';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  const last = names.pop();
  return `${names.join(', ')}, and ${last}`;
}

module.exports = {
  generateEmail
};
