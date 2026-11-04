# Publishing ASTRONO-ME

ASTRONO-ME is an Expo (React Native + TypeScript) app. In v1 it has **no server, no
accounts, and no analytics**: the birth profile, saved readings, and preferences are
stored on the device with AsyncStorage. Billing is behind a single interface in
`src/billing/subscription.ts`; this build ships in `PREVIEW_MODE`, where purchases are
simulated locally and labelled in the app as "Preview build — billing not live". Follow
the steps below to take it live.

## 0. App identity (already configured)

| Setting | Value |
| --- | --- |
| App name | ASTRONO-ME |
| Slug | `astrocan` |
| Version | 1.0.0 |
| iOS bundle identifier | `ca.astrocan.app` |
| Android package | `ca.astrocan.app` |
| Subscription product (monthly) | `ca.astrocan.premium.monthly` — CA$7.99/month |
| Subscription product (annual) | `ca.astrocan.premium.annual` — CA$69.99/year |

`eas.json` contains `development`, `preview`, and `production` build profiles. Fill in
the placeholder Apple ID / App Store Connect app ID under `submit.production.ios` and
provide the Play service-account key (`play-service-account.json`, git-ignored — never
commit it) before using `eas submit`.

**Icon still required:** the bundled `assets/images/icon.png` is the create-expo-app
placeholder. Before submission, replace it with a finished 1024×1024 PNG (no alpha
channel for iOS), plus matching adaptive-icon foreground/background for Android, and
regenerate the splash image. App stores reject placeholder artwork at review.

## 1. Apple Developer Program

1. Enrol at https://developer.apple.com/programs/ — US$99/year, paid to Apple. Use the
   legal entity that will receive payouts and sign the agreements (for a sole
   proprietor, your legal name is shown publicly as the seller; an organization account
   requires a D-U-N-S number).
2. In App Store Connect (https://appstoreconnect.apple.com): complete the **Paid Apps
   agreement**, banking, and tax forms (Canada: GST/HST and the W-8BEN equivalent flow
   are handled in the tax section). Subscriptions cannot be sold until this is active.
3. Create the app: **My Apps → + → New App**, platform iOS, name "ASTRONO-ME", primary
   language English (Canada), bundle ID `ca.astrocan.app`, SKU `astrocan-ios`.

## 2. Google Play Console

1. Register at https://play.google.com/console — one-time US$25 fee. Verify identity
   (required for all new accounts) and complete the payments profile and Canadian tax
   information so subscription payouts can be made.
2. Create the app: **Create app**, name "ASTRONO-ME", default language English (Canada),
   app (not game), free with in-app purchases.
3. Note: new personal accounts must run a **closed test with at least 14 testers for
   14 days** before production access is granted. Plan the launch timeline around this.

## 3. Create the subscription products (exact IDs and CAD prices)

Create these **with prices set in CAD** in both stores. The IDs must match
`PRODUCT_IDS` in `src/billing/subscription.ts` exactly; subscription product IDs cannot
be changed after creation.

### App Store Connect

1. App → **Monetize → Subscriptions** → create a subscription group named
   **"ASTRONO-ME Premium"** (one group, so monthly and annual are upgrades/downgrades of
   each other, not separate subscriptions).
2. Add subscription:
   - Reference name: `Premium Monthly`
   - Product ID: `ca.astrocan.premium.monthly`
   - Duration: 1 month
   - Price: **CA$7.99** (choose Canada as base country/region, price 7.99; Apple
     converts for other territories).
   - Localization (English Canada): display name "ASTRONO-ME Premium — Monthly",
     description "Full chart interpretations, Your Week outlook, compatibility, full
     Learn library, saved readings."
   - **No introductory offer and no free trial in v1** — leave those unset. The paywall
     copy already states "No free trial — you will be charged when you confirm."
3. Add the second subscription in the same group:
   - Reference name: `Premium Annual`
   - Product ID: `ca.astrocan.premium.annual`
   - Duration: 1 year
   - Price: **CA$69.99**
   - Display name "ASTRONO-ME Premium — Annual".
4. Set the group order so Annual is level 1 and Monthly is level 2 (annual is the
   higher-value plan).
5. Add the subscription group localization and the review screenshot of the paywall.
   Subscriptions are reviewed with the first app version — submit them together.

### Google Play Console

1. App → **Monetize → Products → Subscriptions → Create subscription**.
2. Product ID `ca.astrocan.premium.monthly`, name "ASTRONO-ME Premium — Monthly".
   Add a base plan: auto-renewing, billing period 1 month, price for Canada
   **CA$7.99**. No free trial, no introductory price in v1. Activate the base plan.
3. Product ID `ca.astrocan.premium.annual`, name "ASTRONO-ME Premi
...[truncated 8573 chars]um — Annual".
   Add a base plan: auto-renewing, billing period 1 year, price for Canada
   **CA$69.99**. No free trial, no introductory price in v1. Activate the base plan.
4. Under **Monetize → Setup → License testing**, add your test accounts so preview
   builds can run real sandbox purchases.
5. Note: annual at CA$69.99 vs 12 × monthly = CA$95.88 is a saving of about 27% — this
   is the figure quoted on the paywall.

## 4. Wire real billing (RevenueCat recommended)

The paywall, Settings, and restore flows call only the `Billing` interface in
`src/billing/subscription.ts`. To go live with RevenueCat:

1. Create a RevenueCat project at https://app.revenuecat.com and add both stores
   (App Store Connect API key; Play service credentials).
2. In RevenueCat: create an **entitlement** with identifier `premium`. Create products
   pointing at `ca.astrocan.premium.monthly` and `ca.astrocan.premium.annual`. Create
   an **offering** with identifier `default` containing two packages: `$rc_monthly` →
   monthly product, `$rc_annual` → annual product.
3. Install the SDK (SDK 58-compatible version pinned via expo install, as the project
   AGENTS.md requires):
   ```bash
   bun x expo install react-native-purchases
   ```
   `react-native-purchases` contains native code, so after installing, preview and
   production builds must be **EAS dev/production builds** — Expo Go cannot run it.
4. Add the RevenueCat API keys to `app.json` under `extra` (public SDK keys, one per
   platform) and read them with `expo-constants`; call
   `Purchases.configure({ apiKey })` once at app start.
5. In `src/billing/subscription.ts`: set `PREVIEW_MODE = false` and implement the
   `Billing` interface in place of `UnwiredStoreBilling`:
   - `getOfferings()` → `Purchases.getOfferings()`, map `offering.current` packages to
     the `Offering` shape (keep the CAD list prices above as display fallbacks).
   - `purchase(packageId)` → `Purchases.purchasePackage(pkg)`, then read
     `customerInfo.entitlements.active['premium']`.
   - `restorePurchases()` → `Purchases.restorePurchases()`.
   - `getEntitlement()` → `Purchases.getCustomerInfo()`; active when the `premium`
     entitlement exists and is not expired.
6. Until step 5 is done, non-preview mode throws on purchase rather than simulating
   one — by design. **Do not ship a build with `PREVIEW_MODE = true`**: the simulated
   entitlement unlocks Premium without payment.

Native IAP alternative: `expo-iap` (or the stores' billing libraries) behind the same
interface — fetch products by the two IDs, listen for purchase updates, verify receipts
(server-side if you add a server later), and map the active subscription to
`getEntitlement()`. The UI does not change either way.

## 5. Build and submit with EAS

```bash
bun install
bun x eas-cli build --profile preview --platform all     # internal testing build
bun x eas-cli build --profile production --platform all  # store build
bun x eas-cli submit --profile production --platform all # after submit config is filled in
```

Run `bun x tsc --noEmit` and `bun x expo lint` before every store build (project
AGENTS.md rule).

## 6. Privacy declarations (based on v1's local-only data)

### Google Play — Data safety section

- **Data collected:** None. The app does not collect or share any user data; all data
  stays on the device.
- **Data shared with third parties:** None.
- **Security practices:** Data is encrypted in transit — not applicable/no data leaves
  the device; users can request data deletion — yes, deletion is built into the app
  (Profile → Delete all my data), which satisfies the account/data deletion requirement
  given there are no accounts.
- Answer "No" to every data-type row (location, personal info, health, financial,
  messages, photos, etc.), because nothing is transmitted off the device in v1.
- If RevenueCat is added later (section 4), its SDK receives purchase-related
  identifiers: re-answer the Data safety section then (purchases + device IDs,
  collected, not shared, for app functionality) and update PRIVACY_POLICY.md.

### Apple — Privacy nutrition label (App Store Connect → App Privacy)

- **Data Used to Track You:** None.
- **Data Linked to You:** None.
- **Data Not Linked to You:** None. Select **"Data Not Collected"** for every category.
  On-device-only storage (birth details entered by the user) is not "collection" under
  Apple's definition because it never leaves the device and is not accessible to the
  developer.
- Privacy policy URL: publish `PRIVACY_POLICY.md` at a stable public URL and enter it
  here (and in Play Console → Store settings → Privacy policy).

### Permissions

`app.json` requests **no** Android permissions and no iOS usage-description strings:
ASTRONO-ME does not use location, contacts, camera, photos, or notifications in v1.
Birthplace is typed as text and matched against an on-device city table.

## 7. Review notes (paste into both stores' review notes)

> ASTRONO-ME is an astrology companion for reflection and entertainment. All user data
> (birth date/time/place, preferences, saved readings) is stored only on the device;
> there are no accounts and no server in this version.
>
> Subscriptions: "ASTRONO-ME Premium" is an auto-renewable subscription group with two
> plans — CA$7.99/month (ca.astrocan.premium.monthly) and CA$69.99/year
> (ca.astrocan.premium.annual). There is no free trial; the paywall states the full
> price, cadence, renewal, and cancellation terms before purchase. Premium can be
> reached from the Chart, Your Week, Learn, and Profile tabs; Restore Purchases is on
> the paywall and in Profile → Subscription. Audio entries in Learn are labelled
> "coming with Premium" — they are listed, not sold separately.
>
> To review Premium content without purchasing, use the sandbox/test account provided
> in the review credentials field.
>
> The app makes no medical, financial, or predictive claims, contains no user-generated
> public content, and shows no advertising.

## 8. Pre-launch checklist

- [ ] Finished 1024×1024 icon and splash art replace the placeholders.
- [ ] `PREVIEW_MODE` is `false` and purchases tested end-to-end in sandbox/TestFlight
      and Play license testing (buy, restore, cancel, expired state).
- [ ] Privacy policy and terms published at public URLs; URLs entered in both consoles
      and linked in Profile (add the links when the URLs exist).
- [ ] Store listing copied from `STORE_LISTING.md`; screenshots show the real app,
      including the paywall with CAD prices.
- [ ] `bun x tsc --noEmit` clean; `bun x expo lint` clean; production EAS build
      installed and smoke-tested on a real device (onboarding, daily reading, paywall,
      restore, delete-my-data).
