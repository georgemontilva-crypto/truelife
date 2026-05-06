/**
 * Email helper using Resend API
 * Sends transactional emails for account verification and password reset.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email send");
    // In dev, log the email content to console
    console.log("[Email DEV] To:", payload.to);
    console.log("[Email DEV] Subject:", payload.subject);
    console.log("[Email DEV] Body:", payload.html.replace(/<[^>]+>/g, ""));
    return true;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "CHRONIC <noreply@chronic.store>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Verify your CHRONIC account",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #111; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900;">CHRONIC</h1>
            <p style="color: #888; margin: 4px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Expect the Best</p>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #111; margin: 0 0 8px; font-size: 22px;">Verify your email</h2>
            <p style="color: #555; margin: 0 0 32px; font-size: 15px; line-height: 1.6;">
              Hi ${name}, use the code below to verify your account. This code expires in <strong>15 minutes</strong>.
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #111; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #999; font-size: 13px; margin: 0; line-height: 1.6;">
              If you didn't create an account with CHRONIC, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 20px 32px; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} CHRONIC. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Reset your CHRONIC password",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #111; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900;">CHRONIC</h1>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #111; margin: 0 0 8px; font-size: 22px;">Reset your password</h2>
            <p style="color: #555; margin: 0 0 32px; font-size: 15px; line-height: 1.6;">
              Hi ${name}, use the code below to reset your password. This code expires in <strong>15 minutes</strong>.
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #111; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #999; font-size: 13px; margin: 0; line-height: 1.6;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 20px 32px; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} CHRONIC. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
