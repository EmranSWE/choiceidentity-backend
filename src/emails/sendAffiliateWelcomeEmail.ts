import { sendEmail } from "./emailClient";

export async function sendAffiliateWelcomeEmail(
  email: string,
  name: string,
  dashboardLink: string,
  affiliateProfile: { accountManager: string }
) {
  const subject = '👋 Welcome to the Choice Identity Affiliate Program!';

  const html = `
  <!DOCTYPE html>
  <html lang="en" style="margin:0; padding:0; font-family:Inter, Arial, Helvetica, sans-serif;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Choice Identity Affiliate Program</title>
    <style>
      body { margin:0; padding:0; background-color:#F9FAFB; }
      .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; }
      .header { background:#1E40AF; color:#ffffff; text-align:center; padding:40px 20px; }
      .header h1 { margin:0; font-size:28px; line-height:1.2; }
      .header p { margin:10px 0 0; font-size:18px; color:#E0F2FE; }
      .content { padding:40px 30px; color:#111827; font-size:16px; line-height:1.5; }
      .section-title { font-size:20px; font-weight:700; color:#1E40AF; margin:24px 0 16px; }
      .step-item { border-left:4px solid #1E40AF; padding-left:15px; margin-bottom:16px; }
      .step-item span { display:block; }
      .timeline-table, .support-table { width:100%; border-collapse:collapse; margin-bottom:16px; }
      .timeline-table td, .support-table td { padding:4px 0; }
      .button { display:inline-block; padding:16px 32px; background:#1E40AF; color:#ffffff; text-decoration:none; font-weight:600; border-radius:8px; margin:24px 0; }
      .footer { font-size:12px; color:#9CA3AF; text-align:center; padding:20px 0; }
      @media(max-width: 480px) {
        .container { width:100% !important; border-radius:0; }
        .header h1 { font-size:24px; }
        .header p { font-size:16px; }
        .section-title { font-size:18px; }
        .button { padding:14px 24px; font-size:16px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Welcome to the Family, ${name}! 🎉</h1>
        <p>You're now part of the Choice Identity Affiliate Program</p>
      </div>

      <!-- Main Content -->
      <div class="content">
        <p>Thank you for joining our affiliate program. We're excited to have you on board and can't wait to see your success. To ensure you're set up for maximum earnings, here are your next steps:</p>

        <!-- Next Steps -->
        <div class="section-title">Your Action Plan</div>
        <div class="step-item">
          <span style="font-weight:700; color:#1E40AF;">Verify your email</span>
          <span style="color:#6B7280; font-size:14px;">Priority: High • Deadline: within 24 hours</span>
        </div>
        <div class="step-item">
          <span style="font-weight:700; color:#1E40AF;">Upload compliance documents</span>
          <span style="color:#6B7280; font-size:14px;">Priority: High • Deadline: within 72 hours</span>
        </div>
        <div class="step-item">
          <span style="font-weight:700; color:#1E40AF;">Complete onboarding checklist</span>
          <span style="color:#6B7280; font-size:14px;">Priority: Medium • Deadline: within 7 days</span>
        </div>

        <!-- CTA Button -->
        <a href="${dashboardLink}" class="button">Access Your Dashboard</a>

        <!-- Timeline -->
        <div class="section-title">What to Expect</div>
        <table class="timeline-table">
          <tr><td>Approval Process</td><td align="right">2–3 business days</td></tr>
          <tr><td>First Payout</td><td align="right">30–45 days</td></tr>
          <tr><td>Account Manager Contact</td><td align="right">within 24 hours</td></tr>
        </table>

        <!-- Support -->
        <div class="section-title">We're Here to Help</div>
        <table class="support-table">
          <tr><td>📧</td><td><strong>General Support:</strong> help@choiceidentity.com</td></tr>
          <tr><td>👤</td><td><strong>Account Manager:</strong> ${affiliateProfile.accountManager}</td></tr>
          <tr><td>🚨</td><td><strong>Emergency Line:</strong> +1-555-URGENT</td></tr>
        </table>

        <p>We're committed to your success and will provide all the resources you need to thrive as a Choice Identity affiliate.</p>
        <p style="font-size:18px; font-weight:600; color:#1E40AF; text-align:center;">Let's build something amazing together! 🚀</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        &mdash; The Choice Identity Team<br/>
        © 2025 Choice Identity. All rights reserved.<br/>
        1234 Market St, San Francisco, CA 94103<br/>
        <a href="https://choiceidentity.com/unsubscribe" style="color:#6B7280; text-decoration:underline;">Unsubscribe</a> | 
        <a href="https://choiceidentity.com/privacy" style="color:#6B7280; text-decoration:underline;">Privacy Policy</a> | 
        <a href="https://choiceidentity.com/terms" style="color:#6B7280; text-decoration:underline;">Terms of Service</a>
      </div>
    </div>
  </body>
  </html>
  `;

  await sendEmail(email, subject, html);
}
