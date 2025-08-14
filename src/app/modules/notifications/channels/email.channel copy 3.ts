// import nodemailer from "nodemailer";
// import { IOrders } from "../../orders/orders.interface";

// const transporter = nodemailer.createTransport({
//   host: "mail.privateemail.com", // Namecheap Private Email SMTP
//   port: 587,
//   secure: false, 
//   auth: {
//     user: "info@pawajabe.com", // e.g., info@pawajabe.com
//     pass: process.env.EMAIL_PASSWORD, // app password or mailbox password
//   },
// });
//   export async function sendToEmail(order: IOrders) {
//     console.log("Sending order confirmation email...",order);
//       // Implement your email sending logic
//       console.log(`Sending confirmation for order ${order._id}`);
//       // Example: await emailService.sendOrderConfirmation(order);

// //        const mailOptions = {
// //    from: "PawaJabe <onboarding@resend.dev>",
// //     to: "pawajabe.com@gmail.com", // Replace with actual admin email
// //     subject: "🛒 New Order Received - PawaJabe.com",
// //     html: `
// //       <h2>New Order Details</h2>
// //       <p><strong>Name:</strong> ${order.shippingAddress?.name}</p>
// //       <p><strong>Phone:</strong> ${order.customerPhone}</p>
// //       <p><strong>Products:</strong> ${order.items.map(p => `${p.name} x ${p.quantity}`).join(', ')}</p>
// //       <p><strong>Total:</strong> ${order.totalAmount}৳</p>
// //       <p><strong>Delivery Info:</strong> ${order.shippingAddress?.address}</p>
// //     `,
// //   };
// const mailOptions = {
//   from: "PawaJabe <info@pawajabe.com>", // your domain-based email
//   to: "mdemran.swe@gmail.com", // or customer email
//   subject: "🛒 New Order Received - PawaJabe.com",
//   html: `
//     <h2>New Order Details</h2>
//     <p><strong>Name:</strong> ${order.shippingAddress?.name}</p>
//     <p><strong>Phone:</strong> ${order.customerPhone}</p>
//     <p><strong>Products:</strong> ${order.items.map(p => `${p.name} x ${p.quantity}`).join(', ')}</p>
//     <p><strong>Total:</strong> ${order.totalAmount}৳</p>
//     <p><strong>Delivery Info:</strong> ${order.shippingAddress?.address}</p>
//   `,
// };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ Order email sent:", info.messageId);
//   } catch (error) {
//     console.error("❌ Failed to send email:", error);
//   }
//   }
  