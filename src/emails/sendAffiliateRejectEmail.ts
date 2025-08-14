import { renderMjmlTemplate } from './mjmlRenderer';
import { sendEmail } from './emailClient';

export async function sendAffiliateRejectionEmail(email: string, name: string, reason?: string) {
  const subject = 'Your Affiliate Account Has Been Rejected';

  const html = await renderMjmlTemplate('affiliateRejection', {
    name,
    reason: reason || 'No specific reason provided',
  });

  await sendEmail(email, subject, html);
}
