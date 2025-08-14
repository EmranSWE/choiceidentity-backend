"use strict";
// import { IOrders } from "../../orders/orders.interface";
// export async function sendToTelegram(order: IOrders) {
//   const botToken = process.env.TELEGRAM_BOT_TOKEN;
//   const chatId = process.env.TELEGRAM_CHAT_ID; 
//   const message = `🛒 New Order: ৳${order.totalAmount} from ${order.shippingAddress?.name} | ${order.shippingAddress?.phone}`;
//   const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         chat_id: chatId,
//         text: message,
//       }),
//     });
//     const data = await response.json();
//     if (!data.ok) {
//       console.error("Telegram error:", data);
//     } else {
//       console.log("Telegram message sent:");
//     }
//   } catch (error) {
//     console.error("Telegram send error:", error);
//   }
// }
