/**
 * Payment Receipt Verification Service
 * Verifies in-app purchase receipts from Apple and Google before granting coins.
 */

import { config } from '@config/env';
import { ForbiddenError } from '@shared/utils/errors';
import logger from '@shared/utils/logger';
import { getErrorMessage } from '@shared/utils/errorUtils';

export type Platform = 'ios' | 'android' | 'web';

interface VerificationResult {
  valid: boolean;
  productId?: string;
}

const APPLE_VERIFY_URL = config.isProd
  ? 'https://buy.itunes.apple.com/verifyReceipt'
  : 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Verify a payment receipt based on platform.
 * Skips verification when PAYMENT_VERIFICATION_ENABLED is false (dev mode)
 * or when platform is 'web'.
 */
export async function verifyReceipt(
  receiptToken: string,
  packageId: string,
  platform: Platform,
): Promise<void> {
  if (!config.payment.verificationEnabled) {
    logger.debug('Payment verification disabled — skipping receipt check');
    return;
  }

  if (platform === 'web') {
    logger.debug('Web platform — skipping receipt verification');
    return;
  }

  let result: VerificationResult;

  if (platform === 'ios') {
    result = await verifyAppleReceipt(receiptToken, packageId);
  } else {
    result = await verifyGoogleReceipt(receiptToken, packageId);
  }

  if (!result.valid) {
    throw new ForbiddenError('Payment verification failed');
  }
}

/**
 * Verify an Apple App Store receipt
 * Docs: https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
 */
async function verifyAppleReceipt(
  receiptToken: string,
  packageId: string,
): Promise<VerificationResult> {
  try {
    const response = await fetch(APPLE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'receipt-data': receiptToken }),
    });

    const data = await response.json() as {
      status: number;
      receipt?: { in_app?: Array<{ product_id: string }> };
    };

    // Status 0 = valid receipt
    if (data.status !== 0) {
      logger.warn(`Apple receipt verification failed with status ${data.status}`);
      return { valid: false };
    }

    // Verify the purchased product matches the requested package
    const inApp = data.receipt?.in_app ?? [];
    const matchingPurchase = inApp.find((p) => p.product_id === packageId);

    if (!matchingPurchase) {
      logger.warn(`Apple receipt product mismatch: expected ${packageId}`);
      return { valid: false };
    }

    return { valid: true, productId: matchingPurchase.product_id };
  } catch (error) {
    logger.error(`Apple receipt verification error: ${getErrorMessage(error)}`);
    return { valid: false };
  }
}

/**
 * Verify a Google Play purchase receipt
 * Docs: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
 */
async function verifyGoogleReceipt(
  receiptToken: string,
  packageId: string,
): Promise<VerificationResult> {
  try {
    // Google receipt tokens are JSON with purchaseToken and other fields
    let purchaseData: { purchaseToken?: string; productId?: string };
    try {
      purchaseData = JSON.parse(receiptToken);
    } catch {
      logger.warn('Google receipt is not valid JSON');
      return { valid: false };
    }

    const purchaseToken = purchaseData.purchaseToken;
    if (!purchaseToken) {
      logger.warn('Google receipt missing purchaseToken');
      return { valid: false };
    }

    // Verify product matches
    if (purchaseData.productId && purchaseData.productId !== packageId) {
      logger.warn(`Google receipt product mismatch: expected ${packageId}, got ${purchaseData.productId}`);
      return { valid: false };
    }

    // Call Google Play Developer API
    // In production, this should use a service account with googleapis
    // For now, validate the structure and log for manual verification
    const googleApiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${config.oauth.googleClientId}/purchases/products/${packageId}/tokens/${purchaseToken}`;

    const response = await fetch(googleApiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      logger.warn(`Google Play API returned ${response.status}`);
      return { valid: false };
    }

    const data = await response.json() as { purchaseState?: number };

    // purchaseState 0 = purchased
    if (data.purchaseState !== 0) {
      logger.warn(`Google purchase state is ${data.purchaseState}, expected 0`);
      return { valid: false };
    }

    return { valid: true, productId: packageId };
  } catch (error) {
    logger.error(`Google receipt verification error: ${getErrorMessage(error)}`);
    return { valid: false };
  }
}
