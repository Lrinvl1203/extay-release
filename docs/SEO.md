# EXTAY search pages

The Korean guide remains the source of guest content and all five translation dictionaries.
The existing language menu now links to `/guide-extay`, `/en`, `/ja`, `/zh-cn`, and `/zh-tw`.
Explicit language URLs take precedence over stored/browser language. The legacy root URL retains its existing language detection.
Section hashes remain intact when changing language. Existing photos, copy, styling, API and chat settings are preserved.

Run `npm run build:seo` after editing guide content/translations. This renders the four foreign-language files from the existing translation routines, updates reciprocal hreflang links, canonical URLs, metadata, conservative lodging structured data and the five-URL sitemap, then refreshes chatbot page knowledge. Generated HTML files are committed so the current static Vercel deployment does not need a new build configuration.

Run `npm test` before deploying. Tests check generation freshness, executable JavaScript versus JSON-LD parsing, the existing chatbot suite, metadata, original translated copy hashes, and repeat rendering. The copy baseline was taken from commit `4d7cb85ceae9f9899e13c46ae866e8be25f2d100`; update it only for deliberate guest-copy edits.

The foreign-language initial HTML includes the existing translated tour cards. Previously these home cards could stay Korean on first load even when another language was selected. Their translations and default selection are unchanged.

Structured data describes only the existing public lodging name, address, check-in/out times and page metadata. No ratings, prices, capacity, women-only policy or Anotherhouse-specific claims are added. Guest access instructions are excluded from Google snippets using `data-nosnippet`; this is not access control.

Sitemap publication and crawlable HTML do not prove indexing or AI citation. Search Console ownership and current URL inspection must be checked separately. No SNS, OTA or Google Maps edits are part of this change.
