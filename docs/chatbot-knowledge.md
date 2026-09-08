# Chatbot knowledge maintenance

The current guest pages in `guide-extay.html` are authoritative. The Korean and
English PDFs linked from the Guidebook page supplement missing device guidance;
they do not override newer page instructions. Do not infer room counts from photos,
live availability from listed locker capacities, or actual contact details from
placeholder values.

When editing a page, update its facts in `data/guide-knowledge.json`. Include all
restaurant entries and the exact host-pick list. Keep variable external details
(opening hours, public transit, fares and available lockers) labeled as reference
information requiring current verification when requested.

The old late-checkout charge is no longer stated as a confirmed fee because it is
absent from the current page body. This does not mean late checkout is free or
approved. Requests for an extension or fee still require host confirmation.

The API fallback uses `lib/guest-fallback.js` with the knowledge JSON. The browser
uses a generated standalone copy containing the same function and knowledge,
available even if the API request fails. After updating knowledge or translated
fallback templates, run:

```sh
npm run build:chat
npm test
```

Tests reject a stale browser bundle and compare the page's restaurant list and
screen coverage with the knowledge. They also check the known luggage, CCTV,
checkout, laundry and waste-disposal discrepancies.

Each Responses API request still includes the whole knowledge base. Stable system
instructions and the serialized knowledge precede the last six conversation
messages and the current question. A content-versioned `prompt_cache_key` groups
requests using the same prefix. No per-request timestamp or guest ID is inserted
in the shared prefix. Cached input is reported as `usage.cached_tokens` in our
endpoint response and in the `Chat usage` server log, alongside total input/output
tokens. Do not treat a cache hit as guaranteed or as caching the generated answer.

The concierge answers property-specific facts and policies only from the guide.
When the guide lacks general public information (for example a current airport
bus or public transport schedule), it uses web search, then adds a visible public
web-information label and asks the guest to reconfirm with the host. If the API is
unavailable, the browser fallback cannot search and says so plainly before giving
the Airbnb host-contact instruction.

Early-morning and late-night airport questions are an exception to the compact
answer limit. They use a higher web-search context and output budget so the
concierge can give a practical transfer plan, current route number, useful times,
fare when available, terminal note, and one alternative. Keep ordinary property
answers compact.

Before release, verify representative live responses with the actual deployment
environment, including the earlier missing facts and Korean, English, Japanese
and Chinese questions. Confirm the current production head before promotion so
other page edits are retained.
