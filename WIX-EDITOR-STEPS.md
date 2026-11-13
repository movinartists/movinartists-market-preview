# Getting the new design onto the Wix site (hidden / unpublished)

The Wix REST APIs can list existing Studio pages and can set SEO tags on a page that already exists. **They cannot create a new Studio/Editor page, cannot add an HTML iframe or custom element to a page, and cannot hide a page from the menu.** Custom Embeds would inject code into existing live pages, so that was not used. A site-wide publish was not run.

## GitHub preview URL

A new public repo holds the lean preview:

https://github.com/movinartists/movinartists-market-preview

The preview URL, once GitHub Pages is turned on, will be:

https://movinartists.github.io/movinartists-market-preview/

**Turn Pages on (one setting, no other site is affected):** in the repo, Settings → Pages → Deploy from a branch → Branch `main` → folder `/ (root)` → Save. Wait a minute, then open the URL above. After it loads, that is the `src` already in `embed-snippet.html`.

## What is already prepared

- Full self-contained mockup (for local preview or a zip upload): `site-full/`
- Lean web build (CDNs + live Wix product images): `github-pages/`
- Flyer "VIEW / BUY" buttons already point at the live product pages
- Both builds include `<meta name="robots" content="noindex, nofollow">` and a `robots.txt` that disallows all crawlers
- Iframe snippet: `embed-snippet.html`

If a GitHub Pages preview URL is live, use that as the iframe `src`. Otherwise host `github-pages/` or `site-full/` on any static host and paste that URL into the snippet.

## Steps in Wix Studio (you do this — nothing is published for you)

1. Open **My Site** in the Wix Studio Editor: https://www.wix.com/studio (or the Editor from the site dashboard).
2. Add a **new blank page**. Suggested name: `New Design Preview`. Suggested URL slug: `/new-design-preview` (do not use `/` or replace Home).
3. **Do not set it as the homepage.** Leave Home (`/`) as it is.
4. Hide the page from the site menu / header / footer (Wix: page settings → hide from menu). Do not add it to the existing Market / Movin' Artists / Medici App menu.
5. Page SEO settings: set **Hide this page from search engines** / robots `noindex, nofollow` if the checkbox is available.
6. Delete the default blank sections so the page is empty, then add an **HTML iframe / Embed** that is full width and as tall as the viewport (ideally 100vh, no header overlap if you can hide the site header on this page only).
7. Paste the contents of `embed-snippet.html`, with the preview URL filled in.
8. **Save a draft. Do not click Publish** if you want this to stay unpublished. On Wix, a new page only goes live after a site publish. If there are no other unpublished edits, a later publish would make this URL reachable to anyone who has the link, even if it is hidden from the menu — that is why noindex is set on both the page and the embedded preview.
9. Optional: password-protect the page until you are ready to launch.
10. When you are ready to launch, that is a separate decision: you would still need to replace or restyle the homepage in the editor, point the menu at the new page, and then publish. That has not been done.

## After launch (not done now)

- Remove the gold "PREVIEW OF THE NEW DESIGN" bar from the build (`#previewbar` in `index.html` and `site.css`).
- Remove the noindex meta and `robots.txt` disallow, or set the page to be indexable, once this is meant to be public.
- "Add to Cart" on the three plan cards is still a placeholder; "Buy Now" already goes to the live plans page.
