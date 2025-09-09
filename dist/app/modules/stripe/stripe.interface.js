"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeSyncStatus = exports.DunningStatus = exports.BillingInterval = exports.SubscriptionStatus = exports.InvoiceStatus = exports.PaymentIntentStatus = void 0;
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
// Enums
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["UNPAID"] = "unpaid";
    SubscriptionStatus["INCOMPLETE"] = "incomplete";
    SubscriptionStatus["INCOMPLETE_EXPIRED"] = "incomplete_expired";
    SubscriptionStatus["PAUSED"] = "paused";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BillingInterval;
(function (BillingInterval) {
    BillingInterval["MONTHLY"] = "monthly";
    BillingInterval["QUARTERLY"] = "quarterly";
    BillingInterval["YEARLY"] = "yearly";
})(BillingInterval || (exports.BillingInterval = BillingInterval = {}));
var DunningStatus;
(function (DunningStatus) {
    DunningStatus["NONE"] = "none";
    DunningStatus["PENDING"] = "pending";
    DunningStatus["IN_PROGRESS"] = "in_progress";
    DunningStatus["COMPLETED"] = "completed";
    DunningStatus["FAILED"] = "failed";
})(DunningStatus || (exports.DunningStatus = DunningStatus = {}));
var StripeSyncStatus;
(function (StripeSyncStatus) {
    StripeSyncStatus["IN_SYNC"] = "in_sync";
    StripeSyncStatus["PENDING_SYNC"] = "pending_sync";
    StripeSyncStatus["CONFLICT"] = "conflict";
})(StripeSyncStatus || (exports.StripeSyncStatus = StripeSyncStatus = {}));
