# Amplifyd Email Setup

This document outlines the setup for transactional emails sent by the Amplifyd application. We use a third-party email service (e.g., SendGrid, Postmark) for reliable delivery.

## Email Events

The application sends emails for the following events:

1.  **Reviewer Application Received**:
    - **Recipient**: Applicant
    - **Trigger**: After a new reviewer application is submitted.
    - **Content**: Confirms receipt of the application and outlines the review process timeline.

2.  **Reviewer Application Approved**:
    - **Recipient**: Applicant
    - **Trigger**: When an admin approves an application.
    - **Content**: Welcome email with a link to log in and set up their profile.

3.  **Music Submission Confirmation**:
    - **Recipient**: Artist (contact email)
    - **Trigger**: After successful payment for a submission.
    - **Content**: Confirms submission and payment, provides an estimated review turnaround time.

4.  **Review Complete**:
    - **Recipient**: Artist (contact email)
    - **Trigger**: When a reviewer submits their feedback.
    - **Content**: Notification that the review is complete, with a secure link to view the feedback.

5.  **Password Reset**:
    - **Recipient**: Reviewer/Admin
    - **Trigger**: User requests a password reset from the login page.
    - **Content**: Standard password reset link.

## Setup

- Email templates are managed within our email service provider's dashboard.
- API keys are stored securely as environment variables (e.g., `SENDGRID_API_KEY`).
- Server-side functions are responsible for triggering all email sends.
