import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Contact Form Enquiry
  app.post('/api/contact', async (req: Request, res: Response) => {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    if (!body) body = {};

    const { name, email, phone, company, subject, message, source } = body;

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

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const submittedAt = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'short',
        });

        const { error } = await resend.emails.send({
          from: 'Gama LED Website <noreply@mail.gamaled.co.in>',
          to: ['contact@gamaled.co.in'],
          replyTo: email,
          subject: `New Website Enquiry - ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nCompany: ${company || 'Not provided'}\nSubject: ${subject || 'General Enquiry'}\nSource: ${source || 'Website'}\nMessage: ${message}\nSubmitted: ${submittedAt}`,
        });

        if (error) {
          console.error('Resend API error:', error);
          return res.status(500).json({ error: 'Failed to send email. Please try again.' });
        }

        return res.status(200).json({
          success: true,
          message: 'Your enquiry has been received. We will get back to you shortly.',
        });
      } catch (err: any) {
        console.error('Email error:', err?.message || err);
        return res.status(500).json({ error: 'Failed to send message.' });
      }
    }

    // Graceful fallback when RESEND_API_KEY is not configured
    console.log('[Contact Enquiry Received]:', { name, email, phone, company, subject, message, source });
    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been received! Our sales and engineering team will contact you shortly.',
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gama LED App server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
