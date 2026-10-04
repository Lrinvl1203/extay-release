# EXTAY concierge — 2026-10-04

- This deployment uses only `data/guide-knowledge.json` and the complete page snapshot generated from `guide-extay.html`. It does not import Another House training answers, property facts, access codes, API credentials or analytics databases.
- `lib/guest-understanding.js` is property-neutral: multilingual concepts, short question normalization, recent-conversation hints and route direction. Regex hints do not replace model understanding of arbitrary questions.
- `lib/property-concierge.js` presents EXTAY's own verified facts. Only simple single-topic questions use fast answers; nuanced, multi-topic and follow-up requests use the model with the full EXTAY evidence.
- Model responses carry validated route IDs. The UI shows localized direct page links without navigating to another property. Public search still uses official sources where possible and remains separate from property policies.
- The home page's phone/Kakao contact buttons are absent. Legacy placeholders are not operating contact details. Use Airbnb booking messages.
- Check-in is 16:00; pre/post-stay on-site luggage storage is unavailable. Early check-in approval is not stated, so do not import Another House's prohibition. Current home/gallery copy states three bedrooms. Bed count, maximum occupancy and unstated appliance capacities must not be inferred from photos.
- Run `npm run build:chat` after editing website text or curated facts, and `npm test` before deployment. Stale page snapshots/browser fallbacks fail the test check. Browser fallback shares the same understanding but cannot replace live research or model reasoning when the API is unavailable.
- Representative automated synonym checks cover Korean, English, Japanese, Simplified Chinese and Traditional Chinese; this is not a claim that every possible wording has been tested or that the underlying model was fine-tuned.
