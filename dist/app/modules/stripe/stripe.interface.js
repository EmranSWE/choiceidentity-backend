"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingInterval = exports.SubscriptionStatus = exports.InvoiceStatus = exports.PaymentIntentStatus = void 0;
var PaymentIntentStatus;
(function (PaymentIntentStatus) {
    PaymentIntentStatus["REQUIRES_PAYMENT_METHOD"] = "requires_payment_method";
    PaymentIntentStatus["REQUIRES_CONFIRMATION"] = "requires_confirmation";
    PaymentIntentStatus["REQUIRES_ACTION"] = "requires_action";
    PaymentIntentStatus["PROCESSING"] = "processing";
    PaymentIntentStatus["SUCCEEDED"] = "succeeded";
    PaymentIntentStatus["CANCELED"] = "canceled";
})(PaymentIntentStatus || (exports.PaymentIntentStatus = PaymentIntentStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["OPEN"] = "open";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["UNCOLLECTIBLE"] = "uncollectible";
    InvoiceStatus["VOID"] = "void";
    InvoiceStatus["MARKED_UNCOLLECTIBLE"] = "marked_uncollectible";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
// export enum SubscriptionStatus {
//   TRIALING = "trialing",
//   ACTIVE = "active",
//   PAST_DUE = "past_due",
//   CANCELED = "canceled",
//   UNPAID = "unpaid",
//   PAUSED = "paused",
// }
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["INCOMPLETE"] = "incomplete";
    SubscriptionStatus["INCOMPLETE_EXPIRED"] = "incomplete_expired";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["UNPAID"] = "unpaid";
    SubscriptionStatus["PAUSED"] = "paused";
    SubscriptionStatus["EXPIRED"] = "expired";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BillingInterval;
(function (BillingInterval) {
    BillingInterval["MONTHLY"] = "monthly";
    BillingInterval["YEARLY"] = "yearly";
})(BillingInterval || (exports.BillingInterval = BillingInterval = {}));
