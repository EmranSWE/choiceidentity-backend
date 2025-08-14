import { sendEmail } from "./emailClient";

export async function sendAdminSetupEmail(email: string, setupLink: string) {
  const subject = "Admin Setup Link";
  const html = `<p>Click to setup your admin account: <a href="${setupLink}">${setupLink}</a></p>
                <p>Expires in 24 hours.</p>`;

  await sendEmail(email, subject, html);
}