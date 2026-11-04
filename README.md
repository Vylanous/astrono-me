# ASTRONO-ME

A Canadian astrology companion for reflection. ASTRONO-ME builds a free daily reading from your birth chart and the real movement of the Moon, and offers an optional Premium tier for your full chart, a weekly outlook, and a small library of plain-language astrology writing.

The promise is a simple one: understand the week through your chart. Readings are written the way working astrologers write them — named planets, named dates, and a question to sit with at the end. Nothing here predicts your future, and nothing here replaces medical, financial, or any other professional advice. It is a tool for reflection, offered in that spirit.

## What's inside

- **Today** — a free daily reading shaped by your Sun sign and the Moon's actual sign and phase that day.
- **Your chart** — Sun, Moon, and Rising signs calculated from your birth date, time, and place, calculated on your device. Premium adds written interpretations for every placement.
- **Your week** — Premium. The week's real Moon sign changes and quarter phases, with dates, alongside notes on how the Moon moves through your own chart.
- **Learn** — short articles that explain the vocabulary of a chart in plain English. Two are free; the rest come with Premium.
- **Compatibility** — Premium. A reading for two charts, written with the other person's consent in mind.

## Pricing

- Free — the daily reading, your Sun, Moon, and Rising, and two Learn articles.
- Premium — **CA$7.99/month** or **CA$69.99/year**, in Canadian dollars. The full price, renewal, and cancellation terms are shown before purchase. Cancel in one step from your store subscription settings.

Your birth details and readings stay on your phone. There is no account and no server in this version, and Settings includes working export-my-data and delete-my-data controls.

## Tech stack

- Expo SDK 58 with expo-router and React Native
- TypeScript (strict)
- An on-device chart engine — a simplified ephemeris that calculates Sun, Moon, and planetary positions, Moon phase, and ascendant locally; no chart data leaves the device
- AsyncStorage for local persistence
- Billing behind a small internal interface (`src/billing/subscription.ts`), ready for store in-app purchase wiring

## Run it locally

```bash
bun install
bunx expo start
```

Then open it in Expo Go or a development build on iOS or Android.

## A note on billing

Billing currently runs in a clearly labelled preview mode: the paywall shows the real prices and terms, and a preview purchase simulates the entitlement on-device only. No real charge is possible in this build. To take real payments, create the two subscription products in App Store Connect and Google Play Console and wire the store billing library into the interface, following the step-by-step in [PUBLISHING.md](PUBLISHING.md).

See also: [STORE_LISTING.md](STORE_LISTING.md) for the store copy, [PRIVACY_POLICY.md](PRIVACY_POLICY.md), and [TERMS.md](TERMS.md).
