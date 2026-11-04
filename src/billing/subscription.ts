/**
 * ASTRONO-ME billing layer.
 *
 * Every screen talks to billing ONLY through the `Billing` interface below.
 * No paywall or settings code imports a store SDK directly.
 *
 * ============================ INTEGRATION POINT ============================
 * This build ships with PREVIEW_MODE = true: purchases are simulated and
 * stored locally so the full product can be reviewed end to end. Preview
 * purchases are labelled in the app ("Preview build — billing not live").
 *
 * To go live, set PREVIEW_MODE = false and implement the four methods of
 * `Billing` in `createStoreBilling()` below using RevenueCat
 * (`react-native-purchases`) or the stores' native IAP libraries.
 * Step-by-step instructions, including the store product setup, are in
 * PUBLISHING.md at the repo root.
 *
 * Store product identifiers (create exactly these in both stores):
 *   ca.astrocan.premium.monthly  — ASTRONO-ME Premium, monthly, CA$7.99
 *   ca.astrocan.premium.annual   — ASTRONO-ME Premium, annual,  CA$69.99
 * RevenueCat: put both products in one entitlement named "premium" and one
 * offering named "default" with packages $rc_monthly and $rc_annual.
 * ===========================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREVIEW_MODE = true;

export type PackageId = 'monthly' | 'annual';

export interface Offering {
  packageId: PackageId;
  productId: string;
  title: string;
  priceCad: number;
  priceString: string;
  cadence: string;
  note?: string;
}

export interface Entitlement {
  active: boolean;
  productId?: string;
  packageId?: PackageId;
  /** ISO date the current period ends, when known. */
  renewsOrEndsAt?: string;
  source: 'preview' | 'store' | 'access-code';
}

export interface Billing {
  getOfferings(): Promise<Offering[]>;
  purchase(packageId: PackageId): Promise<Entitlement>;
  restorePurchases(): Promise<Entitlement>;
  getEntitlement(): Promise<Entitlement>;
  /**
   * Redeem an access code. A matching code unlocks Premium permanently on
   * this device (no expiry, no renewal). Returns true when the code matched.
   */
  redeemAccessCode(code: string): Promise<boolean>;
  /** Deep link to the store's subscription management screen for this app. */
  manageSubscriptionsUrl(platform: 'ios' | 'android'): string;
}

export const PRODUCT_IDS: Record<PackageId, string> = {
  monthly: 'ca.astrocan.premium.monthly',
  annual: 'ca.astrocan.premium.annual',
};

const OFFERINGS: Offering[] = [
  {
    packageId: 'monthly',
    productId: PRODUCT_IDS.monthly,
    title: 'ASTRONO-ME Premium — Monthly',
    priceCad: 7.99,
    priceString: 'CA$7.99',
    cadence: 'per month, billed monthly',
  },
  {
    packageId: 'annual',
    productId: PRODUCT_IDS.annual,
    title: 'ASTRONO-ME Premium — Annual',
    priceCad: 69.99,
    priceString: 'CA$69.99',
    cadence: 'per year, billed once a year',
    note: 'About 27% less than paying monthly for twelve months (12 × CA$7.99 = CA$95.88).',
  },
];

/* --------------------------------------------------------- access codes */

/**
 * The access code that opens Premium permanently on a device. Shared with a
 * small number of people directly; it is not printed anywhere in the app.
 * Comparison is case-insensitive and ignores surrounding whitespace.
 */
export const ACCESS_CODE = 'GOLDMOON';

export const ACCESS_CODE_KEY = 'astrocan.access-code.v1';

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function hasRedeemedAccessCode(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ACCESS_CODE_KEY)) != null;
  } catch {
    return false;
  }
}

async function persistAccessCodeRedemption(code: string): Promise<boolean> {
  if (normalizeCode(code) !== ACCESS_CODE) return false;
  await AsyncStorage.setItem(
    ACCESS_CODE_KEY,
    JSON.stringify({ redeemedAt: new Date().toISOString() }),
  );
  return true;
}

const ACCESS_CODE_ENTITLEMENT: Entitlement = { active: true, source: 'access-code' };

/* ------------------------------------------------------- preview billing */

const PREVIEW_KEY = 'astrocan.preview.entitlement.v1';

class PreviewBilling implements Billing {
  async getOfferings(): Promise<Offering[]> {
    return OFFERINGS;
  }

  async purchase(packageId: PackageId): Promise<Entitlement> {
    const now = new Date();
    const end = new Date(now);
    if (packageId === 'monthly') end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);
    const entitlement: Entitlement = {
      active: true,
      productId: PRODUCT_IDS[packageId],
      packageId,
      renewsOrEndsAt: end.toISOString(),
      source: 'preview',
    };
    await AsyncStorage.setItem(PREVIEW_KEY, JSON.stringify(entitlement));
    return entitlement;
  }

  async restorePurchases(): Promise<Entitlement> {
    // In preview mode "restore" simply re-reads the locally stored state,
    // which mirrors what a store restore would return on this device.
    return this.getEntitlement();
  }

  async redeemAccessCode(code: string): Promise<boolean> {
    return persistAccessCodeRedemption(code);
  }

  async getEntitlement(): Promise<Entitlement> {
    // A redeemed access code opens Premium permanently and takes
    // precedence over any simulated preview purchase.
    if (await hasRedeemedAccessCode()) return ACCESS_CODE_ENTITLEMENT;
    try {
      const raw = await AsyncStorage.getItem(PREVIEW_KEY);
      if (!raw) return { active: false, source: 'preview' };
      const parsed = JSON.parse(raw) as Entitlement;
      if (parsed.renewsOrEndsAt && new Date(parsed.renewsOrEndsAt) < new Date()) {
        return { active: false, source: 'preview' };
      }
      return { ...parsed, source: 'preview' };
    } catch {
      return { active: false, source: 'preview' };
    }
  }

  async cancelPreview(): Promise<void> {
    await AsyncStorage.removeItem(PREVIEW_KEY);
  }

  manageSubscriptionsUrl(platform: 'ios' | 'android'): string {
    return platform === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?package=ca.astrocan.app';
  }
}

/* --------------------------------------------------------- store billing */

/**
 * Live-store implementation goes here. With RevenueCat
 * (`react-native-purchases`) the shape is:
 *
 *   import Purchases from 'react-native-purchases';
 *   // configured once at app start with the platform API key
 *   getOfferings:      (await Purchases.getOfferings()).current.availablePackages
 *   purchase:          await Purchases.purchasePackage(pkg) -> check
 *                      customerInfo.entitlements.active['premium']
 *   restorePurchases:  await Purchases.restorePurchases()
 *   getEntitlement:    (await Purchases.getCustomerInfo())
 *                        .entitlements.active['premium'] != null
 *
 * Until that is wired, non-preview mode refuses to sell anything rather
 * than pretending a purchase happened.
 */
class UnwiredStoreBilling implements Billing {
  async getOfferings(): Promise<Offering[]> {
    return OFFERINGS;
  }
  async purchase(): Promise<Entitlement> {
    throw new Error(
      'Store billing is not wired in this build. See PUBLISHING.md for the RevenueCat integration steps.',
    );
  }
  async restorePurchases(): Promise<Entitlement> {
    return { active: false, source: 'store' };
  }
  async redeemAccessCode(code: string): Promise<boolean> {
    return persistAccessCodeRedemption(code);
  }
  async getEntitlement(): Promise<Entitlement> {
    if (await hasRedeemedAccessCode()) return ACCESS_CODE_ENTITLEMENT;
    return { active: false, source: 'store' };
  }
  manageSubscriptionsUrl(platform: 'ios' | 'android'): string {
    return platform === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?package=ca.astrocan.app';
  }
}

export const billing: Billing = PREVIEW_MODE ? new PreviewBilling() : new UnwiredStoreBilling();

/** Preview-only helper used by Settings to end a simulated subscription. */
export async function cancelPreviewSubscription(): Promise<void> {
  if (PREVIEW_MODE && billing instanceof PreviewBilling) {
    await billing.cancelPreview();
  }
}

/**
 * Redeem an access code through the active billing implementation.
 * Returns true when the code matched and Premium is now unlocked.
 */
export async function redeemAccessCode(code: string): Promise<boolean> {
  return billing.redeemAccessCode(code);
}
