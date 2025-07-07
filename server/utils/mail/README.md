# Mailer Service Abstraction

This directory contains the abstracted mailer service for the application. The goal is to easily swap email providers without changing the application logic.

The core of this system is the `mailer.ts` interface, which defines the contract that all mailer implementations must follow. The main application interacts only with this interface via the `mailer` object exported from `index.ts`.

## Current Configuration: Resend

Currently, the application is configured to use **Resend** for sending emails.

- **Implementation**: `ResendMailer.ts`
- **Configuration**: The Resend API key is managed via the `RESEND_API_KEY` environment variable and configured in `nuxt.config.ts`.

## How to Switch to a Self-Hosted SMTP Server

When you are ready to use your own Postfix SMTP server, you can switch providers by following these steps. This example uses `nodemailer`, a popular library for sending emails in Node.js.

### Step 1: Install Nodemailer

First, add the `nodemailer` package and its types to your project.

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

### Step 2: Create the SMTP Mailer Implementation

Create a new file named `SmtpMailer.ts` inside this directory (`server/utils/mail/`). This file will contain the logic to connect to your local Postfix server and send emails.

**File: `server/utils/mail/SmtpMailer.ts`**
```typescript
import nodemailer from 'nodemailer';
import type { Mailer } from './mailer';

// Configure the transport to connect to your local Postfix server.
// Postfix typically runs on localhost, port 25.
// No authentication is needed when sending from the same server.
const transport = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false, // Postfix on port 25 uses STARTTLS, not direct SSL.
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

export const smtpMailer: Mailer = {
  async sendPasswordResetEmail(to: string, link: string) {
    try {
      await transport.sendMail({
        from: '"Dreamseed No-Reply" <no-reply@dreamseed.co>',
        to,
        subject: 'Reset Your Password for Dreamseed',
        text: `Hello,\n\nPlease click the following link to reset your password. This link is valid for 15 minutes.\n\n${link}\n\nIf you did not request a password reset, please ignore this email.`,
        html: `<p>Hello,</p><p>Please click the following link to reset your password. This link is valid for 15 minutes.</p><p><a href="${link}">${link}</a></p><p>If you did not request a password reset, please ignore this email.</p>`,
      });
      console.log(`[SMTP Mailer] Password reset email successfully sent to ${to}`);
    } catch (error) {
      console.error(`[SMTP Mailer] Failed to send email to ${to}:`, error);
      throw new Error('Failed to send password reset email.');
    }
  },
};
```

### Step 3: Update the Index File to Use the New Mailer

Finally, open `server/utils/mail/index.ts` and change which mailer is exported.

**File: `server/utils/mail/index.ts`**

**Change this:**
```typescript
import { resendMailer } from './ResendMailer';
import type { Mailer } from './mailer';

export const mailer: Mailer = resendMailer;
```

**To this:**
```typescript
import { smtpMailer } from './SmtpMailer'; // <-- Import the new mailer
import type { Mailer } from './mailer';

// Switch the export to use the SMTP mailer
export const mailer: Mailer = smtpMailer;
```

After these changes and restarting your application, all password reset emails will be sent through your self-hosted Postfix server instead of Resend. No other part of the application needs to be modified. 