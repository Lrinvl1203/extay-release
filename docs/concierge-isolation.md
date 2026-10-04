# EXTAY concierge — 2026-10-04

- This deployment uses only `data/guide-knowledge.json` and the complete page snapshot generated from `guide-extay.html`. It does not import Another House training answers, property facts, access codes, API credentials or analytics databases.
- `lib/guest-understanding.js` is property-neutral: multilingual concepts, short question normalization, recent-conversation hints and route direction. Regex hints do not replace model understanding of arbitrary questions.
- `lib/property-concierge.js` presents EXTAY's own verified facts. Only simple single-topic questions use fast answers; nuanced, multi-topic and follow-up requests use the model with the full EXTAY evidence.
- Model responses carry validated route IDs. The UI shows localized direct page links without navigating to another property. Public search still uses official sources where possible and remains separate from property policies.
- The home page's phone/Kakao contact buttons are absent. Legacy placeholders are not operating contact details. Use Airbnb booking messages.
- Check-in is 16:00; pre/post-stay on-site luggage storage is unavailable. Early check-in approval is not stated, so do not import Another House's prohibition. Current home/gallery copy states three bedrooms. Bed count, maximum occupancy and unstated appliance capacities must not be inferred from photos.
- Run `npm run build:chat` after editing website text or curated facts, and `npm test` before deployment. Stale page snapshots/browser fallbacks fail the test check. Browser fallback shares the same understanding but cannot replace live research or model reasoning when the API is unavailable.
- Representative automated synonym checks cover Korean, English, Japanese, Simplified Chinese and Traditional Chinese; this is not a claim that every possible wording has been tested or that the underlying model was fine-tuned.

## Final QA repairs — 2026-10-04 (v5)

- Unknown amenity/error fallback answers no longer call private property questions a public-web-search connection failure. Hair tools stay distinct from laundry appliances. Used towels do not receive clean-stock pickup instructions.
- The frequent luggage reply has five authored translations, including direct Traditional Chinese rather than incomplete character conversion. Remaining legacy cabinet/locker copy has corrected Traditional characters and regression checks.
- Station/exit confirmations without another named destination default to arrival at EXTAY and correct a false station premise with the current Noksapyeong Exit 2 route. Explicit sightseeing destinations remain the guest's actual destination.
- An operating restriction does not prove physical facility absence. The model must not invent storage rooms, room numbers or used-towel collection procedures.
- API error fallbacks expose a fixed `fallback_reason` and log that reason and upstream status without raw questions, answers, histories, credentials or provider error messages. HTTP 200 with `fallback: true` must not be counted as a normal model response. Server error causes still need logs to diagnose; a generic fallback is not evidence of billing exhaustion.
