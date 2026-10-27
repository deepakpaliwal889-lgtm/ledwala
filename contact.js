import { Resend } from 'resend';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body) body = {};

  const { name, email, phone, company, subject, message, source } = body;

  // Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Guard: make sure API key is loaded
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error. Please contact us directly at contact@gamaled.co.in' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const submittedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #e11d48; padding: 28px 32px; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
          .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px; }
          .body { padding: 32px; }
          .field { margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; }
          .field:last-of-type { border-bottom: none; }
          .label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
          .value { font-size: 15px; color: #1a1a1a; line-height: 1.5; }
          .message-box { background: #f9f9f9; border-left: 4px solid #e11d48; padding: 16px; border-radius: 4px; font-size: 15px; color: #333; line-height: 1.6; white-space: pre-wrap; }
          .footer { background: #f9f9f9; padding: 20px 32px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
          .footer a { color: #e11d48; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 New Website Enquiry</h1>
            <p>Received via Gama LED website</p>
          </div>
          <div class="body">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${email}" style="color:#e11d48;">${email}</a></div>
            </div>
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${phone || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${company || 'Not provided'}</div>
            </div>
            ${subject ? `
            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${subject}</div>
            </div>` : ''}
            <div class="field">
              <div class="label">Message / Requirement</div>
              <div class="message-box">${message}</div>
            </div>
            <div class="field">
              <div class="label">Source</div>
              <div class="value">${source || 'Website'}</div>
            </div>
            <div class="field" style="border-bottom:none; margin-bottom:0; padding-bottom:0;">
              <div class="label">Submitted At</div>
              <div class="value">${submittedAt} IST</div>
            </div>
          </div>
          <div class="footer">
            Website: <a href="https://gamaled.co.in">https://gamaled.co.in</a> &nbsp;|&nbsp;
            Reply directly to this email to contact <strong>${name}</strong> at ${email}
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: 'Gama LED Website <noreply@mail.gamaled.co.in>',
      to: ['contact@gamaled.co.in'],
      replyTo: email,
      subject: `New Website Enquiry - ${name}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }

    return res.status(200).json({ success: true, message: 'Your enquiry has been received. We will get back to you shortly.' });
  } catch (err) {
    console.error('Server error:', err.message || err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
