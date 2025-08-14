// import { IOrders } from "../../orders/orders.interface";

//   export async function sendDiscordNotification(order: IOrders) {
//   const webhookUrl = "https://discord.com/api/webhooks/1376605147265896488/uxgjGp-64MxJKpQ0g1EgeP3PHVe9LztXANv3d2mZNemRo0LTDKA_sM4cE76IABRh-5qR";

//   const message = {
//     username: "PawaJabe Bot",
//     avatar_url: "https://pawajabe.com/favicon.ico", 
//     content: `📦 **New Order Alert!**\n💰 Amount: ৳${order.totalAmount}\n👤 Customer: ${order.shippingAddress?.name}\n📞 Phone: ${order.shippingAddress?.phone}\n\n#NewOrder #PawaJabe`,
//   };

//   try {
//     const response = await fetch(webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(message),
//     });

//     if (!response.ok) {
//       console.error("Failed to send Discord notification:", await response.text());
//     }
//   } catch (error) {
//     console.error("Discord webhook error:", error);
//   }
// }