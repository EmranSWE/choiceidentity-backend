import { renderMjmlTemplate } from './mjmlRenderer';
import { sendEmail } from './emailClient';

export async function sendAffiliateApprovalEmail(email: string, name: string, referralCode: string) {
  const subject = 'Your Affiliate Account is Approved!';

  const html = await renderMjmlTemplate('affiliateApproval', {
    name,
    referralCode,
  });

  await sendEmail(email, subject, html);
}
