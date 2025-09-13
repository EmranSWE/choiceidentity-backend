"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
const http_status_1 = __importDefault(require("http-status"));
const stripe_utils_1 = require("./stripe.utils");
const stripe_model_1 = require("./stripe.model");
const apiErrors_1 = __importDefault(require("../../../errors/apiErrors"));
const auth_model_1 = require("../auth/auth.model");
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = require("../../../enums/user");
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const affiliate_utils_1 = require("../affiliate/affiliate.utils");
const affiliate_model_1 = require("../affiliate/affiliate.model");
const getSubscription = (subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscription = yield stripe_utils_1.stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error(`❌ Failed to retrieve subscription ${subscriptionId}:`, error);
        throw error;
    }
});
/**
 * Creates a Stripe PaymentIntent and saves it to the database (existing functionality)
 */
const createTrialSubscription = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Debug log with color and icon
    // eslint-disable-next-line no-console
    console.log('=====Stripe data all', data);
    const session = yield mongoose_1.default.startSession();
    let result;
    let stripeCustomer;
    let subscription;
    let paymentMethodId;
    let referredAffiliate;
    let referredByAffiliateId;
    let referralCodeUsed = null;
    try {
        const { key, paymentMethodId, email, firstName, lastName, planType, billingInterval, phone, country, address, marketingConsent, affiliateId, clickId, subId, } = data;
        if (!key || !paymentMethodId || !email || !planType || !billingInterval) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Missing required fields');
        }
        const plan = stripe_utils_1.PROTECTION_PLANS[planType][billingInterval];
        console.log('Stripe plan', plan);
        if (!plan)
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Invalid plan type');
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            //@ts-ignore
            const isUserExist = yield auth_model_1.User.isUserExist(email, session);
            console.log('Stripe isUserExist', isUserExist);
            if (isUserExist) {
                throw new apiErrors_1.default(http_status_1.default.CONFLICT, 'User already exists. Please check your details and try again.');
            }
            const extraMetadata = {
                planType: String(planType),
                billingInterval: String(billingInterval),
                affiliateId: affiliateId ? String(affiliateId) : '',
                subId: subId ? String(subId) : '',
                agreeMarketingEmail: data.agreeMarketingEmail ? 'true' : 'false',
                agreeAutoRenewal: data.agreeAutoRenewal ? 'true' : 'false',
                agreeTerms: data.agreeTerms ? 'true' : 'false',
                signupSource: data.signupSource ? String(data.signupSource) : 'web',
                signupCampaign: data.signupCampaign ? String(data.signupCampaign) : '',
                signupReferrer: data.signupReferrer ? String(data.signupReferrer) : '',
            };
            console.log('Stripe extraMetadata', extraMetadata);
            const name = `${firstName} ${lastName || ''}`.trim();
            stripeCustomer = yield (0, stripe_utils_1.createStripeCustomer)({
                key,
                email,
                name,
                phone,
                country,
                address,
                planType,
                billingInterval,
                marketingConsent,
                affiliateId,
                extraMetadata,
            });
            console.log('Stripe customer', stripeCustomer);
            //@ts-ignore
            const { attached } = yield (0, stripe_utils_1.attachAndSetDefaultPaymentMethod)({
                customerId: stripeCustomer.id,
                paymentMethodId,
                key,
                extraMetadata,
            });
            console.log('attached', attached);
            // -------------------------------
            // Step 2: Decide trial & payment based on affiliate
            // -------------------------------
            const isAffiliate = !!affiliateId;
            console.log('IsAffiliate', isAffiliate);
            const baseAmount = isAffiliate
                ? plan.amount + plan.baseAmount
                : plan.baseAmount;
            const trialDays = isAffiliate ? 0 : 7;
            console.log('🔍 Amount Incoming data:', baseAmount, 'trialDays', trialDays);
            const paymentIntent = yield (0, stripe_utils_1.createPaymentIntent)({
                customerId: stripeCustomer.id,
                paymentMethodId,
                key,
                baseAmount,
                setupFee: plan.setupFee,
                currency: 'usd',
                planType,
                billingInterval,
                extraMetadata,
            });
            console.log('paymentIntent', paymentIntent);
            if (paymentIntent.status === 'requires_action' &&
                ((_a = paymentIntent.next_action) === null || _a === void 0 ? void 0 : _a.type) === 'use_stripe_sdk') {
                throw new apiErrors_1.default(http_status_1.default.PAYMENT_REQUIRED, 'Payment requires additional authentication', JSON.stringify({
                    paymentIntentId: paymentIntent.id,
                    nextAction: paymentIntent.next_action,
                }));
            }
            if (paymentIntent.status !== 'succeeded') {
                throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, 'Payment verification failed');
            }
            subscription = yield (0, stripe_utils_1.createStripeSubscription)({
                key,
                customerId: stripeCustomer.id,
                planPriceId: plan.priceId,
                billingInterval,
                trialPeriodDays: trialDays,
                metadata: extraMetadata,
            });
            console.log('subscription', subscription);
            // Handle incomplete or past_due subscription
            if (['incomplete', 'past_due'].includes(subscription.status)) {
                throw new apiErrors_1.default(http_status_1.default.PAYMENT_REQUIRED, `Subscription is ${subscription.status}, requires attention`, JSON.stringify({
                    subscriptionId: subscription.id,
                }));
            }
            if (affiliateId) {
                try {
                    // Find the referring affiliate by their referral code
                    referredAffiliate = yield auth_model_1.User.findOne({ 'affiliateProfile.referralCode': affiliateId }, { affiliateProfile: 1, email: 1, _id: 1 }).session(session);
                    if (referredAffiliate) {
                        console.log('referredAffiliate', referredAffiliate);
                        // Only process referral if payment was successful
                        if (paymentIntent.status === 'succeeded') {
                            // Prevent self-referrals
                            if (referredAffiliate.email === email) {
                                console.warn('🚨 Self-referral attempt detected, ignoring.');
                            }
                            else {
                                referredByAffiliateId = referredAffiliate._id;
                                console.log('referredByAffiliateId', referredByAffiliateId);
                                referralCodeUsed = affiliateId;
                                console.log('referralCodeUsed', referralCodeUsed);
                                // Determine commission status based on whether the purchaser is also an affiliate
                                const commissionStatus = isAffiliate ? 'confirmed' : 'pending';
                                console.log('IsAffiliate for commission', commissionStatus);
                                let commissionRate = 0.2;
                                let commissionAmount = 0;
                                let affiliateLink = null;
                                // If clickId exists, try to get commission rate from AffiliateLink
                                if (clickId) {
                                    try {
                                        const isValidClickId = yield (0, affiliate_utils_1.validateClickId)(clickId, session);
                                        console.log('isValidClickId', isValidClickId);
                                        if (isValidClickId) {
                                            affiliateLink = yield (0, affiliate_utils_1.findAffiliateLinkByClickId)(clickId, session);
                                            if (affiliateLink) {
                                                // Get commission rate from affiliate link
                                                commissionRate = (0, stripe_utils_1.getCommissionRate)(affiliateLink, referredAffiliate);
                                                commissionAmount = Math.round(plan.amount * commissionRate);
                                                console.log('Link-Based Commission:', {
                                                    affiliateLinkId: affiliateLink._id,
                                                    subId: affiliateLink.subId,
                                                    linkCommissionRate: affiliateLink.commissionRate,
                                                    finalCommissionRate: commissionRate,
                                                    commissionAmount: commissionAmount,
                                                });
                                                // Update conversion stats for the subId
                                                yield (0, affiliate_utils_1.updateConversionStats)(affiliateLink._id, affiliateLink.subId || 'default', plan.amount, commissionAmount, session);
                                                // Mark click as converted in the click log
                                                yield affiliate_model_1.ClickLog.updateOne({ clickId }, {
                                                    $set: {
                                                        status: 'converted',
                                                        conversionId: subscription.id,
                                                        convertedAt: new Date(),
                                                    },
                                                }, { session });
                                                console.log('✅ Updated AffiliateLink analytics for subId:', affiliateLink.subId);
                                            }
                                        }
                                    }
                                    catch (linkError) {
                                        console.error('Error processing affiliate link:', linkError);
                                        // Fallback to profile commission rate if link processing fails
                                        commissionRate =
                                            referredAffiliate.affiliateProfile.commissionRate || 0.2;
                                        commissionAmount = Math.round(plan.amount * commissionRate);
                                        console.log('Falling back to profile commission rate due to error');
                                    }
                                }
                                else {
                                    // No clickId - Use profile commission rate
                                    commissionRate =
                                        referredAffiliate.affiliateProfile.commissionRate || 0.2;
                                    commissionAmount = Math.round(plan.amount * commissionRate);
                                    console.log('Profile-Based Commission:', {
                                        commissionRate: commissionRate,
                                        commissionAmount: commissionAmount,
                                    });
                                }
                                // Update the affiliate's stats and add the referral
                                const updateData = {
                                    $inc: {
                                        'affiliateProfile.totalReferrals': 1,
                                        'affiliateProfile.pendingCommissions': isAffiliate
                                            ? 0
                                            : commissionAmount,
                                        'affiliateProfile.confirmedCommissions': isAffiliate
                                            ? commissionAmount
                                            : 0,
                                        'affiliateProfile.performanceMetrics.signups': 1,
                                        'affiliateProfile.performanceMetrics.conversions': isAffiliate ? 1 : 0,
                                        'affiliateProfile.performanceMetrics.revenue': plan.amount,
                                    },
                                    $push: {
                                        'affiliateProfile.referrals': Object.assign({ email, customerName: name, subscriptionId: subscription.id, date: new Date(), status: commissionStatus, paymentStatus: isAffiliate ? 'paid' : 'pending', amount: plan.amount, commission: commissionAmount, commissionRate: commissionRate, plan: planType, billingInterval: billingInterval, commissionSource: clickId ? 'link' : 'profile' }, (clickId &&
                                            affiliateLink && {
                                            clickId,
                                            affiliateLinkId: affiliateLink._id,
                                        })),
                                    },
                                };
                                yield auth_model_1.User.updateOne({ _id: referredAffiliate._id }, updateData, { session });
                                console.log('✅ Successfully updated affiliate referral and commission data');
                            }
                        }
                        else {
                            console.log('Payment not succeeded, skipping affiliate processing');
                        }
                    }
                    else {
                        console.log('No affiliate found with referral code:', affiliateId);
                    }
                }
                catch (error) {
                    console.error('Error processing affiliate referral:', error);
                }
            }
            const customerData = {
                name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                address: data.address,
                dateOfBirth: data.dob ? new Date(data.dob) : undefined,
                role: user_1.ENUM_USER_ROLE.CUSTOMER,
                customerProfile: {
                    firstName: firstName,
                    lastName: lastName,
                    ssn: data.ssn,
                    stripeCustomerId: stripeCustomer.id,
                    stripeSubscriptionId: subscription.id,
                    subscriptionStatus: subscription.status === 'trialing' ? 'trialing' : 'active',
                    currentPlan: planType,
                    planInterval: billingInterval,
                    subscriptionStartDate: subscription.start_date
                        ? new Date(subscription.start_date * 1000)
                        : undefined,
                    trialEndDate: subscription.trial_end
                        ? new Date(subscription.trial_end * 1000)
                        : undefined,
                    billingAddress: {
                        line1: ((_b = data.address) === null || _b === void 0 ? void 0 : _b.street) || '',
                        line2: ((_c = data.address) === null || _c === void 0 ? void 0 : _c.apartment) || '',
                        city: ((_d = data.address) === null || _d === void 0 ? void 0 : _d.city) || '',
                        state: ((_e = data.address) === null || _e === void 0 ? void 0 : _e.state) || '',
                        postalCode: ((_f = data.address) === null || _f === void 0 ? void 0 : _f.zipCode) || '',
                        country: ((_g = data.address) === null || _g === void 0 ? void 0 : _g.country) || 'USA',
                    },
                    agreeAutoRenewal: data.agreeAutoRenewal || true,
                    privacyPolicyAcceptedAt: new Date(),
                    termsAcceptedAt: new Date(),
                    preferences: {
                        alerts: {
                            email: true,
                            sms: false,
                            push: true,
                        },
                        reports: {
                            frequency: 'monthly',
                            format: 'pdf',
                        },
                        communication: {
                            promotional: data.agreeMarketingEmail || false,
                            educational: true,
                            security: true,
                        },
                    },
                    referredBy: referredByAffiliateId || null,
                    referralCodeUsed: referralCodeUsed || null,
                },
                signupSource: data.signupSource || 'web',
                signupCampaign: data.signupCampaign,
                signupReferrer: data.signupReferrer,
                marketingConsent: {
                    email: data.agreeMarketingEmail || false,
                    sms: false,
                    givenAt: new Date(),
                },
                agreeTerms: data.agreeTerms || false,
                agreeMarketingEmail: data.agreeMarketingEmail || false,
                termsAcceptedAt: new Date(),
                privacyPolicyAcceptedAt: new Date(),
                communicationPreferences: {
                    email: data.agreeMarketingEmail || true,
                    sms: false,
                    push: false,
                },
            };
            //   Use the Customer discriminator to create the user
            const createdUser = yield auth_model_1.Customer.create([customerData], { session });
            console.log('Finally created user', createdUser);
            const sanitizedUser = createdUser[0].toJSON();
            console.log('Finally created user', sanitizedUser);
            const { currentPeriodStart, currentPeriodEnd, trialStart, trialEnd } = (0, stripe_utils_1.getSubscriptionDates)(subscription, billingInterval);
            const subscriptionDb = yield stripe_model_1.Subscription.create([
                {
                    userId: createdUser[0]._id,
                    stripeSubscriptionId: subscription.id,
                    planType,
                    priceId: plan.priceId,
                    priceAmount: plan.amount,
                    currency: 'usd',
                    billingInterval,
                    status: subscription.status,
                    quantity: subscription.items.data[0].quantity || 1,
                    currentPeriodStart,
                    currentPeriodEnd,
                    trialStart,
                    trialEnd,
                    trialPeriodDays: trialDays,
                    isTrial: trialDays > 0,
                    billingCycleAnchor: (0, stripe_utils_1.safeStripeDateConvert)(subscription.billing_cycle_anchor),
                    startDate: (0, stripe_utils_1.safeStripeDateConvert)(subscription.start_date) || new Date(),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    defaultPaymentMethodId: paymentMethodId,
                    cardBrand: ((_h = attached === null || attached === void 0 ? void 0 : attached.card) === null || _h === void 0 ? void 0 : _h.brand) || null,
                    cardLast4: ((_j = attached === null || attached === void 0 ? void 0 : attached.card) === null || _j === void 0 ? void 0 : _j.last4) || null,
                    lastSyncedAt: new Date(),
                },
            ], { session });
            console.log('subscriptionDb', subscriptionDb);
            //   @ts-ignore
            const { _id, role } = createdUser[0];
            //   Access token
            const accessToken = jwtHelpers_1.jwtHelpers.createToken(
            //   @ts-ignore
            { userId: _id, email: createdUser[0].email, role }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
            const refreshToken = jwtHelpers_1.jwtHelpers.createToken(
            //@ts-ignore
            { email: createdUser[0].email, role }, config_1.default.jwt.refresh_Secret, config_1.default.jwt.refresh_secret_Expires);
            result = {
                accessToken,
                refreshToken,
                user: {
                    name,
                    userId: createdUser[0]._id,
                    customerId: stripeCustomer.id,
                    subscriptionId: subscription.id,
                    paymentIntentId: paymentIntent.id,
                    planDetails: {
                        name: planType,
                        billingInterval,
                        features: plan.features,
                        price: plan.amount / 100,
                    },
                },
            };
        }));
        //@ts-ignore
        return result;
    }
    catch (error) {
        yield (0, stripe_utils_1.cleanupOrphanStripeResources)(stripeCustomer === null || stripeCustomer === void 0 ? void 0 : stripeCustomer.id, paymentMethodId, subscription === null || subscription === void 0 ? void 0 : subscription.id);
        console.error('❌ Subscription + User creation failed:', error);
        if (error instanceof apiErrors_1.default)
            throw error;
        if (error instanceof stripe_utils_1.stripe.errors.StripeError) {
            throw new apiErrors_1.default(http_status_1.default.BAD_REQUEST, error.message || 'Payment processing failed');
        }
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Unexpected error creating trial subscription');
    }
    finally {
        session.endSession();
    }
});
const GetPlans = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planEntries = Object.entries(stripe_utils_1.PROTECTION_PLANS);
        const plans = yield Promise.all(planEntries.map((_a) => __awaiter(void 0, [_a], void 0, function* ([planKey, plan]) {
            const [monthlyPrice, yearlyPrice] = yield Promise.all([
                stripe_utils_1.stripe.prices.retrieve(plan.monthly.priceId),
                stripe_utils_1.stripe.prices.retrieve(plan.yearly.priceId),
            ]);
            if (!monthlyPrice.active || !yearlyPrice.active) {
                throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Inactive price found for ${planKey} plan`);
            }
            return {
                name: planKey,
                monthly: {
                    id: monthlyPrice.id,
                    amount: monthlyPrice.unit_amount || 0,
                    currency: monthlyPrice.currency,
                    features: plan.monthly.features,
                },
                yearly: {
                    id: yearlyPrice.id,
                    amount: yearlyPrice.unit_amount || 0,
                    currency: yearlyPrice.currency,
                    features: plan.yearly.features,
                },
            };
        })));
        return plans;
    }
    catch (error) {
        if (error instanceof apiErrors_1.default)
            throw error;
        throw new apiErrors_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to retrieve plans');
    }
});
exports.StripeService = {
    //   createCheckoutSession,
    //   updateCheckoutSessionStatus,
    //   getCheckoutSession,
    createPaymentIntent: stripe_utils_1.createPaymentIntent,
    //   updatePaymentStatus,
    //   getPaymentIntent,
    //   getPaymentIntentsByUser,
    //   isPaymentIntentExist,
    getSubscription,
    createTrialSubscription,
    GetPlans,
};
