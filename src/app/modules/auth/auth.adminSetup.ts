// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // services/adminSetup.ts
// import crypto from "crypto";
// import nodemailer from "nodemailer";
//    //  @ts-ignore
// import { AdminSetupToken, User } from "./auth.model";

// export async function ensureAdmin() {
//   const existing = await User.findOne({ role: "admin" });
//   if (existing) return;

//   const token = crypto.randomBytes(16).toString("hex");
//   const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

//   await AdminSetupToken.create({ email: process.env.ADMIN_EMAIL!, token, expiresAt });

//   const setupLink = `${process.env.FRONTEND_URL}/admin/setup?token=${token}`;
//   const transporter = nodemailer.createTransport(process.env.MAILER_DSN!);
//   await transporter.sendMail({
//     from: `no-reply@${process.env.APP_DOMAIN}`,
//     to: process.env.ADMIN_EMAIL!,
//     subject: "Admin Setup Link",
//     text: `Click to setup your admin account: ${setupLink}\nExpires in 24 hours.`,
//   });

//   console.log(`✅ Admin setup link sent to ${process.env.ADMIN_EMAIL}`);
// }
