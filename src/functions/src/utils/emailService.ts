// functions/src/utils/emailService.ts

// This file will contain functions for sending emails.
// Example: using Nodemailer or SendGrid

import * as functions from 'firebase-functions';
const nodemailer = require('nodemailer');

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  console.log(`[EmailService] Attempting to send email to: ${to}, Subject: ${subject}`);

  // Ensure environment variables are loaded
  if (!functions.config().email || !functions.config().email.user || !functions.config().email.pass) {
    console.error('Email credentials not set in Firebase functions config. Skipping email send.');
    return;
  }

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass
    }
  });

  let mailOptions = {
    from: '"Amplifyd" <no-reply@amplifyd.com>',
    to: to,
    subject: subject,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}
