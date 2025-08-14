import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
const mailOptions = {
  from: process.env.FROM_EMAIL,
  replyTo: process.env.SUPPORT_EMAIL,
  to: to || "mdimransheikh181@gmail.com", 
  subject,
  html,
};
console.log(`Sending email to: ${to} with subject: ${subject}`); 
  try {
    await transporter.sendMail(mailOptions);
    // console.info('Email sent: ', info);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
