/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';
import {
  stripe,
  PlanType,
  cleanupOrphanStripeResources,
  createStripeCustomer,
  createPaymentIntent,
  createStripeSubscription,
  attachAndSetDefaultPaymentMethod,
  getSubscriptionDates,
  safeStripeDateConvert,
  getCommissionRate,
  PROTECTION_PLANS,
} from './stripe.utils';
import { Subscription } from './stripe.model';
import {
  PlanDetails,
  ProtectionPlan,
  SubscriptionData,
  TrialSubscriptionResult,
} from './stripe.interface';
import ApiError from '../../../errors/apiErrors';
import Stripe from 'stripe';
import { Customer, User } from '../auth/auth.model';
import mongoose, { Types } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import {
  findAffiliateLinkByClickId,
  updateConversionStats,
  validateClickId,
} from '../affiliate/affiliate.utils';
import { ClickLog } from '../affiliate/affiliate.model';

const getSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error(
      `❌ Failed to retrieve subscription ${subscriptionId}:`,
      error
    );
    throw error;
  }
};

/**
 * Creates a Stripe PaymentIntent and saves it to the database (existing functionality)
 */

// const createTrialSubscription = async (
//   data: SubscriptionData
// ): Promise<TrialSubscriptionResult> => {
//   // Debug log with color and icon
//   // eslint-disable-next-line no-console
//   console.log('=====Stripe data all', data);

//   const session = await mongoose.startSession();

//   let result;
//   let stripeCustomer: Stripe.Customer | undefined;
//   let subscription: Stripe.Subscription | undefined;
//   let paymentMethodId: string | undefined;
//   let referredAffiliate;
//   let referredByAffiliateId: Types.ObjectId | undefined;
//   let referralCodeUsed: string | null = null;

//   try {
//     const {
//       key,
//       paymentMethodId,
//       email,
//       firstName,
//       lastName,
//       planType,
//       billingInterval,
//       phone,
//       country,
//       address,
//       marketingConsent,
//       affiliateId,
//       clickId,
//       subId,
//     } = data;

//     if (!key || !paymentMethodId || !email || !planType || !billingInterval) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
//     }

//     const plan = PROTECTION_PLANS[planType][billingInterval];

//     console.log('Stripe plan', plan);

//     if (!plan) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plan type');

//     await session.withTransaction(async () => {
//       //@ts-ignore
//       const isUserExist = await User.isUserExist(email, session);

//       console.log('Stripe isUserExist', isUserExist);

//       if (isUserExist) {
//         throw new ApiError(
//           httpStatus.CONFLICT,
//           'User already exists. Please check your details and try again.'
//         );
//       }

//       const extraMetadata: Record<string, string> = {
//         planType: String(planType),
//         billingInterval: String(billingInterval),
//         affiliateId: affiliateId ? String(affiliateId) : '',
//         subId: subId ? String(subId) : '',
//         agreeMarketingEmail: data.agreeMarketingEmail ? 'true' : 'false',
//         agreeAutoRenewal: data.agreeAutoRenewal ? 'true' : 'false',
//         agreeTerms: data.agreeTerms ? 'true' : 'false',
//         signupSource: data.signupSource ? String(data.signupSource) : 'web',
//         signupCampaign: data.signupCampaign ? String(data.signupCampaign) : '',
//         signupReferrer: data.signupReferrer ? String(data.signupReferrer) : '',
//       };

//       console.log('Stripe extraMetadata', extraMetadata);

//       const name = `${firstName} ${lastName || ''}`.trim();

//       stripeCustomer = await createStripeCustomer({
//         key,
//         email,
//         name,
//         phone,
//         country,
//         address,
//         planType,
//         billingInterval,
//         marketingConsent,
//         affiliateId,
//         extraMetadata,
//       });

//       console.log('Stripe customer', stripeCustomer);

//       //@ts-ignore
//       const { attached } = await attachAndSetDefaultPaymentMethod({
//         customerId: stripeCustomer.id,
//         paymentMethodId,
//         key,
//         extraMetadata,
//       });

//       console.log('attached', attached);

//       // -------------------------------
//       // Step 2: Decide trial & payment based on affiliate
//       // -------------------------------
//       const isAffiliate = !!affiliateId;

//       console.log('IsAffiliate', isAffiliate);

//       const trialDays = isAffiliate ? 0 : 7;

//       console.log(

//         'trialDays',
//         trialDays
//       );

//       const paymentIntent = await createPaymentIntent({
//         customerId: stripeCustomer.id,
//         paymentMethodId,
//         key,
//         baseAmount: plan.baseAmount,
//         setupFee: plan.setupFee,
//         currency: 'usd',
//         planType,
//         billingInterval,
//         extraMetadata,
//       });

//       console.log('paymentIntent', paymentIntent);

//       if (
//         paymentIntent.status === 'requires_action' &&
//         paymentIntent.next_action?.type === 'use_stripe_sdk'
//       ) {
//         throw new ApiError(
//           httpStatus.PAYMENT_REQUIRED,
//           'Payment requires additional authentication',
//           JSON.stringify({
//             paymentIntentId: paymentIntent.id,
//             nextAction: paymentIntent.next_action,
//           })
//         );
//       }

//       if (paymentIntent.status !== 'succeeded') {
//         throw new ApiError(
//           httpStatus.BAD_REQUEST,
//           'Payment verification failed'
//         );
//       }

//       subscription = await createStripeSubscription({
//         key,
//         customerId: stripeCustomer.id,
//         planPriceId: plan.priceId,
//         billingInterval,
//         trialPeriodDays: trialDays,
//         metadata: extraMetadata,
//       });

//       console.log('subscription', subscription);

//       // Handle incomplete or past_due subscription
//       if (['incomplete', 'past_due'].includes(subscription.status)) {
//         throw new ApiError(
//           httpStatus.PAYMENT_REQUIRED,
//           `Subscription is ${subscription.status}, requires attention`,
//           JSON.stringify({
//             subscriptionId: subscription.id,
//           })
//         );
//       }

//       if (affiliateId) {
//         try {
//           // Find the referring affiliate by their referral code
//           referredAffiliate = await User.findOne(
//             { 'affiliateProfile.referralCode': affiliateId },
//             { affiliateProfile: 1, email: 1, _id: 1 }
//           ).session(session);

//           if (referredAffiliate) {
//             console.log('referredAffiliate', referredAffiliate);

//             // Only process referral if payment was successful
//             if (paymentIntent.status === 'succeeded') {
//               // Prevent self-referrals
//               if (referredAffiliate.email === email) {
//                 console.warn('🚨 Self-referral attempt detected, ignoring.');
//               } else {
//                 referredByAffiliateId = referredAffiliate._id;
//                 console.log('referredByAffiliateId', referredByAffiliateId);

//                 referralCodeUsed = affiliateId;
//                 console.log('referralCodeUsed', referralCodeUsed);

//                 // Determine commission status based on whether the purchaser is also an affiliate
//                 const commissionStatus = isAffiliate ? 'confirmed' : 'pending';
//                 console.log('IsAffiliate for commission', commissionStatus);

//                 let commissionRate = 0.2;
//                 let commissionAmount = 0;
//                 let affiliateLink = null;

//                 // If clickId exists, try to get commission rate from AffiliateLink
//                 if (clickId) {
//                   try {
//                     const isValidClickId = await validateClickId(
//                       clickId,
//                       session
//                     );
//                     console.log('isValidClickId', isValidClickId);

//                     if (isValidClickId) {
//                       affiliateLink = await findAffiliateLinkByClickId(
//                         clickId,
//                         session
//                       );

//                       if (affiliateLink) {
//                         // Get commission rate from affiliate link
//                         commissionRate = getCommissionRate(
//                           affiliateLink,
//                           referredAffiliate
//                         );
//                         commissionAmount = Math.round(
//                           plan.amount * commissionRate
//                         );

//                         console.log('Link-Based Commission:', {
//                           affiliateLinkId: affiliateLink._id,
//                           subId: affiliateLink.subId,
//                           linkCommissionRate: affiliateLink.commissionRate,
//                           finalCommissionRate: commissionRate,
//                           commissionAmount: commissionAmount,
//                         });

//                         // Update conversion stats for the subId
//                         await updateConversionStats(
//                           affiliateLink._id,
//                           affiliateLink.subId || 'default',
//                           plan.amount,
//                           commissionAmount,
//                           session
//                         );

//                         // Mark click as converted in the click log
//                         await ClickLog.updateOne(
//                           { clickId },
//                           {
//                             $set: {
//                               status: 'converted',
//                               conversionId: subscription.id,
//                               convertedAt: new Date(),
//                             },
//                           },
//                           { session }
//                         );

//                         console.log(
//                           '✅ Updated AffiliateLink analytics for subId:',
//                           affiliateLink.subId
//                         );
//                       }
//                     }
//                   } catch (linkError) {
//                     console.error(
//                       'Error processing affiliate link:',
//                       linkError
//                     );
//                     // Fallback to profile commission rate if link processing fails
//                     commissionRate =
//                       referredAffiliate.affiliateProfile.commissionRate || 0.2;
//                     commissionAmount = Math.round(plan.amount * commissionRate);
//                     console.log(
//                       'Falling back to profile commission rate due to error'
//                     );
//                   }
//                 } else {
//                   // No clickId - Use profile commission rate
//                   commissionRate =
//                     referredAffiliate.affiliateProfile.commissionRate || 0.2;
//                   commissionAmount = Math.round(plan.amount * commissionRate);

//                   console.log('Profile-Based Commission:', {
//                     commissionRate: commissionRate,
//                     commissionAmount: commissionAmount,
//                   });
//                 }

//                 // Update the affiliate's stats and add the referral
//                 const updateData = {
//                   $inc: {
//                     'affiliateProfile.totalReferrals': 1,
//                     'affiliateProfile.pendingCommissions': isAffiliate
//                       ? 0
//                       : commissionAmount,
//                     'affiliateProfile.confirmedCommissions': isAffiliate
//                       ? commissionAmount
//                       : 0,
//                     'affiliateProfile.performanceMetrics.signups': 1,
//                     'affiliateProfile.performanceMetrics.conversions':
//                       isAffiliate ? 1 : 0,
//                     'affiliateProfile.performanceMetrics.revenue': plan.amount,
//                   },
//                   $push: {
//                     'affiliateProfile.referrals': {
//                       email,
//                       customerName: name,
//                       subscriptionId: subscription.id,
//                       date: new Date(),
//                       status: commissionStatus,
//                       paymentStatus: isAffiliate ? 'paid' : 'pending',
//                       amount: plan.amount,
//                       commission: commissionAmount,
//                       commissionRate: commissionRate,
//                       plan: planType,
//                       billingInterval: billingInterval,
//                       commissionSource: clickId ? 'link' : 'profile',
//                       ...(clickId &&
//                         affiliateLink && {
//                           clickId,
//                           affiliateLinkId: affiliateLink._id,
//                         }),
//                     },
//                   },
//                 };

//                 await User.updateOne(
//                   { _id: referredAffiliate._id },
//                   updateData,
//                   { session }
//                 );

//                 console.log(
//                   '✅ Successfully updated affiliate referral and commission data'
//                 );
//               }
//             } else {
//               console.log(
//                 'Payment not succeeded, skipping affiliate processing'
//               );
//             }
//           } else {
//             console.log('No affiliate found with referral code:', affiliateId);
//           }
//         } catch (error) {
//           console.error('Error processing affiliate referral:', error);
//         }
//       }

//       const customerData = {
//         name,
//         email: data.email,
//         password: data.password,
//         phone: data.phone,
//         address: data.address,
//         dateOfBirth: data.dob ? new Date(data.dob) : undefined,
//         role: ENUM_USER_ROLE.CUSTOMER,
//         customerProfile: {
//           firstName: firstName,
//           lastName: lastName,
//           ssn: data.ssn,
//           stripeCustomerId: stripeCustomer.id,
//           stripeSubscriptionId: subscription.id,
//           subscriptionStatus:
//             subscription.status === 'trialing' ? 'trialing' : 'active',
//           currentPlan: planType,
//           planInterval: billingInterval,
//           subscriptionStartDate: subscription.start_date
//             ? new Date(subscription.start_date * 1000)
//             : undefined,
//           trialEndDate: subscription.trial_end
//             ? new Date(subscription.trial_end * 1000)
//             : undefined,
//           billingAddress: {
//             line1: data.address?.street || '',
//             line2: data.address?.apartment || '',
//             city: data.address?.city || '',
//             state: data.address?.state || '',
//             postalCode: data.address?.zipCode || '',
//             country: data.address?.country || 'USA',
//           },
//           agreeAutoRenewal: data.agreeAutoRenewal || true,
//           privacyPolicyAcceptedAt: new Date(),
//           termsAcceptedAt: new Date(),
//           preferences: {
//             alerts: {
//               email: true,
//               sms: false,
//               push: true,
//             },
//             reports: {
//               frequency: 'monthly',
//               format: 'pdf',
//             },
//             communication: {
//               promotional: data.agreeMarketingEmail || false,
//               educational: true,
//               security: true,
//             },
//           },

//           referredBy: referredByAffiliateId || null,
//           referralCodeUsed: referralCodeUsed || null,
//         },
//         signupSource: data.signupSource || 'web',
//         signupCampaign: data.signupCampaign,
//         signupReferrer: data.signupReferrer,
//         marketingConsent: {
//           email: data.agreeMarketingEmail || false,
//           sms: false,
//           givenAt: new Date(),
//         },
//         agreeTerms: data.agreeTerms || false,
//         agreeMarketingEmail: data.agreeMarketingEmail || false,
//         termsAcceptedAt: new Date(),
//         privacyPolicyAcceptedAt: new Date(),
//         communicationPreferences: {
//           email: data.agreeMarketingEmail || true,
//           sms: false,
//           push: false,
//         },
//       };

//       //   Use the Customer discriminator to create the user
//       const createdUser = await Customer.create([customerData], { session });

//       console.log('Finally created user', createdUser);

//       const sanitizedUser = createdUser[0].toJSON();

//       console.log('Finally created user', sanitizedUser);

//       const { currentPeriodStart, currentPeriodEnd, trialStart, trialEnd } =
//         getSubscriptionDates(subscription, billingInterval);

//       const subscriptionDb = await Subscription.create(
//         [
//           {
//             userId: createdUser[0]._id,
//             stripeSubscriptionId: subscription.id,
//             planType,
//             priceId: plan.priceId,
//             priceAmount: plan.amount,
//             currency: 'usd',
//             billingInterval,
//             status: subscription.status,
//             quantity: subscription.items.data[0].quantity || 1,
//             currentPeriodStart,
//             currentPeriodEnd,
//             trialStart,
//             trialEnd,
//             trialPeriodDays: trialDays,
//             isTrial: trialDays > 0,
//             billingCycleAnchor: safeStripeDateConvert(
//               subscription.billing_cycle_anchor
//             ),
//             startDate:
//               safeStripeDateConvert(subscription.start_date) || new Date(),

//             cancelAtPeriodEnd: subscription.cancel_at_period_end,
//             defaultPaymentMethodId: paymentMethodId,
//             cardBrand: attached?.card?.brand || null,
//             cardLast4: attached?.card?.last4 || null,
//             lastSyncedAt: new Date(),
//           },
//         ],
//         { session }
//       );

//       console.log('subscriptionDb', subscriptionDb);
//       //   @ts-ignore
//       const { _id, role } = createdUser[0];
//       //   Access token
//       const accessToken = jwtHelpers.createToken(
//         //   @ts-ignore
//         { userId: _id, email: createdUser[0].email, role },
//         config.jwt.secret as Secret,
//         config.jwt.expires_in as string
//       );

//       const refreshToken = jwtHelpers.createToken(
//         //@ts-ignore
//         { email: createdUser[0].email, role },
//         config.jwt.refresh_Secret as Secret,
//         config.jwt.refresh_secret_Expires as string
//       );
//       result = {
//         accessToken,
//         refreshToken,
//         user: {
//           name,
//           userId: createdUser[0]._id,
//           customerId: stripeCustomer.id,
//           subscriptionId: subscription.id,
//           paymentIntentId: paymentIntent.id,
//           planDetails: {
//             name: planType,
//             billingInterval,
//             features: plan.features,
//             price: plan.amount / 100,
//           },
//         },
//       };
//     });
//     //@ts-ignore
//     return result;
//   } catch (error) {
//     await cleanupOrphanStripeResources(
//       stripeCustomer?.id,
//       paymentMethodId,
//       subscription?.id
//     );

//     console.error('❌ Subscription + User creation failed:', error);
//     if (error instanceof ApiError) throw error;
//     if (error instanceof stripe.errors.StripeError) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         error.message || 'Payment processing failed'
//       );
//     }
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Unexpected error creating trial subscription'
//     );
//   } finally {
//     session.endSession();
//   }
// };

const createTrialSubscription = async (
  data: SubscriptionData
): Promise<TrialSubscriptionResult> => {

  console.log('=====Stripe data all=================', data);

  const session = await mongoose.startSession();
  let result;
  let stripeCustomer: Stripe.Customer | undefined;
  let subscription: Stripe.Subscription | undefined;
  let paymentMethodId: string | undefined;
  let referredAffiliate;
  let referredByAffiliateId: Types.ObjectId | undefined;
  let referralCodeUsed: string | null = null;

  try {
    const {
      key,
      paymentMethodId,
      email,
      firstName,
      lastName,
      planType,
      billingInterval,
      phone,
      country,
      address,
      marketingConsent,
      affiliateId,
      clickId,
      subId,
    } = data;

    if (!key || !paymentMethodId || !email || !planType || !billingInterval) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    const plan = PROTECTION_PLANS[planType][billingInterval];

    console.log('Stripe plan', plan);

    if (!plan) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plan type');

    await session.withTransaction(async () => {
      //@ts-ignore
      const isUserExist = await User.isUserExist(email, session);


      if (isUserExist) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'User already exists. Please check your details and try again.'
        );
      }

      const extraMetadata: Record<string, string> = {
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


      const name = `${firstName} ${lastName || ''}`.trim();

      stripeCustomer = await createStripeCustomer({
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


      //@ts-ignore
      const { attached } = await attachAndSetDefaultPaymentMethod({
        customerId: stripeCustomer.id,
        paymentMethodId,
        key,
        extraMetadata,
      });


      const isAffiliate = !!affiliateId;
      const trialDays = isAffiliate ? 0 : 7;

      // Create subscription
      const subscription = await createStripeSubscription({
        customerId: stripeCustomer.id,
        planPriceId: plan.priceId,
        key,
        trialPeriodDays: trialDays,
        extraMetadata,
        paymentMethodId,
        baseAmount: plan.baseAmount,
        setupFeeAmount: plan.setupFee,
        planType,
        billingInterval,
      });

      // Handle incomplete or past_due subscription
      if (['incomplete', 'past_due'].includes(subscription.status)) {
        throw new ApiError(
          httpStatus.PAYMENT_REQUIRED,
          `Subscription is ${subscription.status}, requires attention`,
          JSON.stringify({
            subscriptionId: subscription.id,
          })
        );
      }
      console.log('Subscription created successfully:', subscription);

      if (affiliateId) {
        try {
          // Find the referring affiliate by their referral code
          referredAffiliate = await User.findOne(
            { 'affiliateProfile.referralCode': affiliateId },
            { affiliateProfile: 1, email: 1, _id: 1 }
          ).session(session);

          if (referredAffiliate) {

            // Prevent self-referrals
            if (referredAffiliate.email === email) {
              console.warn('🚨 Self-referral attempt detected, ignoring.');
            } else {
              referredByAffiliateId = referredAffiliate._id;

              referralCodeUsed = affiliateId;

              // Determine commission status based on whether the purchaser is also an affiliate
              const commissionStatus = isAffiliate ? 'confirmed' : 'pending';

              let commissionRate = 0.2;
              let commissionAmount = 0;
              let affiliateLink = null;

              // If clickId exists, try to get commission rate from AffiliateLink
              if (clickId) {
                try {
                  const isValidClickId = await validateClickId(
                    clickId,
                    session
                  );

                  if (isValidClickId) {
                    affiliateLink = await findAffiliateLinkByClickId(
                      clickId,
                      session
                    );

                    if (affiliateLink) {
                      // Get commission rate from affiliate link
                      commissionRate = getCommissionRate(
                        affiliateLink,
                        referredAffiliate
                      );
                      commissionAmount = Math.round(
                        plan.amount * commissionRate
                      );

                    
                      // Update conversion stats for the subId
                      await updateConversionStats(
                        affiliateLink._id,
                        affiliateLink.subId || 'default',
                        plan.amount,
                        commissionAmount,
                        session
                      );

                      // Mark click as converted in the click log
                      await ClickLog.updateOne(
                        { clickId },
                        {
                          $set: {
                            status: 'converted',
                            conversionId: subscription.id,
                            convertedAt: new Date(),
                          },
                        },
                        { session }
                      );
                    }
                  }
                } catch (linkError) {
                  console.error('Error processing affiliate link:', linkError);
                  commissionRate =
                    referredAffiliate.affiliateProfile.commissionRate || 0.2;
                  commissionAmount = Math.round(plan.amount * commissionRate);
                }
              } else {
                // No clickId - Use profile commission rate
                commissionRate =
                  referredAffiliate.affiliateProfile.commissionRate || 0.2;
                commissionAmount = Math.round(plan.amount * commissionRate);
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
                  'affiliateProfile.performanceMetrics.conversions': isAffiliate
                    ? 1
                    : 0,
                  'affiliateProfile.performanceMetrics.revenue': plan.amount,
                },
                $push: {
                  'affiliateProfile.referrals': {
                    email,
                    customerName: name,
                    subscriptionId: subscription.id,
                    date: new Date(),
                    status: commissionStatus,
                    paymentStatus: isAffiliate ? 'paid' : 'pending',
                    amount: plan.amount,
                    commission: commissionAmount,
                    commissionRate: commissionRate,
                    plan: planType,
                    billingInterval: billingInterval,
                    commissionSource: clickId ? 'link' : 'profile',
                    ...(clickId &&
                      affiliateLink && {
                        clickId,
                        affiliateLinkId: affiliateLink._id,
                      }),
                  },
                },
              };

              await User.updateOne({ _id: referredAffiliate._id }, updateData, {
                session,
              });          
            }
          } else {
            console.log('No affiliate found with referral code:', affiliateId);
          }
        } catch (error) {
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
        role: ENUM_USER_ROLE.CUSTOMER,
        customerProfile: {
          firstName: firstName,
          lastName: lastName,
          ssn: data.ssn,
          stripeCustomerId: stripeCustomer.id,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus:
            subscription.status === 'trialing' ? 'trialing' : 'active',
          currentPlan: planType,
          planInterval: billingInterval,
          subscriptionStartDate: subscription.start_date
            ? new Date(subscription.start_date * 1000)
            : undefined,
          trialEndDate: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined,
          billingAddress: {
            line1: data.address?.street || '',
            line2: data.address?.apartment || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            postalCode: data.address?.zipCode || '',
            country: data.address?.country || 'USA',
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
      const createdUser = await Customer.create([customerData], { session });

      console.log('Finally created user', createdUser);

      const sanitizedUser = createdUser[0].toJSON();

      console.log('Finally created user', sanitizedUser);

      const { currentPeriodStart, currentPeriodEnd, trialStart, trialEnd } =
        getSubscriptionDates(subscription, billingInterval);

      const subscriptionDb = await Subscription.create(
        [
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
            billingCycleAnchor: safeStripeDateConvert(
              subscription.billing_cycle_anchor
            ),
            startDate:
              safeStripeDateConvert(subscription.start_date) || new Date(),

            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            defaultPaymentMethodId: paymentMethodId,
            cardBrand: attached?.card?.brand || null,
            cardLast4: attached?.card?.last4 || null,
            lastSyncedAt: new Date(),
          },
        ],
        { session }
      );

      console.log('subscriptionDb', subscriptionDb);
      //   @ts-ignore
      const { _id, role } = createdUser[0];
      //   Access token
      const accessToken = jwtHelpers.createToken(
        //   @ts-ignore
        { userId: _id, email: createdUser[0].email, role },
        config.jwt.secret as Secret,
        config.jwt.expires_in as string
      );

      const refreshToken = jwtHelpers.createToken(
        //@ts-ignore
        { email: createdUser[0].email, role },
        config.jwt.refresh_Secret as Secret,
        config.jwt.refresh_secret_Expires as string
      );
      result = {
        accessToken,
        refreshToken,
        user: {
          name,
          userId: createdUser[0]._id,
          customerId: stripeCustomer.id,
          subscriptionId: subscription.id,
          paymentIntentId: null,
          planDetails: {
            name: planType,
            billingInterval,
            features: plan.features,
            price: plan.amount / 100,
          },
        },
      };
    });
    //@ts-ignore
    return result;
  } catch (error) {
    await cleanupOrphanStripeResources(
      stripeCustomer?.id,
      paymentMethodId,
      subscription?.id
    );

    console.error('❌ Subscription + User creation failed:', error);
    if (error instanceof ApiError) throw error;
    if (error instanceof stripe.errors.StripeError) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        error.message || 'Payment processing failed'
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Unexpected error creating trial subscription'
    );
  } finally {
    session.endSession();
  }
};


const GetPlans = async (): Promise<PlanDetails[]> => {
  try {
    const planEntries = Object.entries(PROTECTION_PLANS) as [
      PlanType,
      ProtectionPlan
    ][];

    const plans = await Promise.all(
      planEntries.map(async ([planKey, plan]) => {
        const [monthlyPrice, yearlyPrice] = await Promise.all([
          stripe.prices.retrieve(plan.monthly.priceId),
          stripe.prices.retrieve(plan.yearly.priceId),
        ]);

        if (!monthlyPrice.active || !yearlyPrice.active) {
          throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Inactive price found for ${planKey} plan`
          );
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
      })
    );

    return plans;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to retrieve plans'
    );
  }
};

export const StripeService = {
  //   createCheckoutSession,
  //   updateCheckoutSessionStatus,
  //   getCheckoutSession,
  createPaymentIntent,
  //   updatePaymentStatus,
  //   getPaymentIntent,
  //   getPaymentIntentsByUser,
  //   isPaymentIntentExist,
  getSubscription,
  createTrialSubscription,
  GetPlans,
};
