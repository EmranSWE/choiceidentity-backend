"use strict";
// import { IOrders } from "../../orders/orders.interface";
// export async function sendOrderToGoogleSheet(order: IOrders) {
//   const webhookUrl = "https://script.google.com/macros/s/AKfycbwdoSVuW5EnvSoI2iprBJbUgdtWLS0b11wgCCaK-PAQfZnbHVadmTqBWh52_xvQJ3hI/exec";
//   const payload = {
//     orderId: order.shortCode,
//     name: order.shippingAddress?.name,
//     phone: order.shippingAddress?.phone,
//     amount: order.totalAmount,
//     address: order.shippingAddress?.address,
//   };
//    try {
//     const response =  await fetch(webhookUrl, {
//     method: "POST",
//     body: JSON.stringify(payload),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
//     if (!response.ok) {
//       console.error("Failed to send sheet notification:", await response.text());
//     }
//   } catch (error) {
//     console.error("Sheet webhook error:", error);
//   }
// }
