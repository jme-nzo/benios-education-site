# BENIOS Education — Website

A clean, modern marketing + enrollment site for **BENIOS Education**, built as a
static site (plain HTML/CSS) styled after **GitHub's Primer** design system.
It's hosted on **GitHub Pages** and hands off payment to **Shopify**, with
**Calendly** booking and an **email contact form** after purchase.

## Pages (matches the information architecture)

| Page | File | Purpose |
|------|------|---------|
| Home (landing) | `index.html` | The front door — what BENIOS Education is |
| About | `about.html` | Story, mission, who it's for |
| XR Growth in SG | `xr-growth.html` | Why immersive tech is growing in Singapore |
| Packages | `packages.html` | 3 pricing tiers → redirect to Shopify checkout |
| Contact / Book | `book.html` | Calendly booking + email contact form |

Design tokens live in `assets/styles.css` (Primer neutral scale, accent blue
`#0969da`, primary green `#1f883d`, system font stack).

---

## The purchase flow (how the pieces connect)

```
Packages page                Shopify (hosted)             book.html
─────────────                ────────────────             ─────────
[Enroll — Pro]  ──redirect──►  Cart → Checkout → Pay
                                        │
                                        ├─► Confirmation EMAIL (Shopify)
                                        │
                                        └─► "Thank you" redirect ──►  Calendly booking
                                                                       + contact form
```

Your GitHub Pages site is the **shopfront and content**. Shopify is only the
**payment engine**. Calendly + the form handle **booking and questions**. You
never handle card data yourself — Shopify does.

---

## 1. Shopify setup (payments)

**Goal:** a buyer clicks *Enroll* on `packages.html` and lands directly in a
Shopify checkout for that specific package.

### Step 1 — Create the store & products
1. Sign up at [shopify.com](https://www.shopify.com) (the **Basic** plan is fine to start).
2. **Products → Add product.** Create one product per package:
   - *BENIOS Starter* — price `S$490`
   - *BENIOS Pro* — price `S$1,290`
   - *BENIOS Team* — price `S$4,900`
3. For a course, set each product to **not** require shipping:
   *Product → uncheck "This is a physical product".*
4. **Settings → Payments →** activate a provider. In Singapore, **Shopify Payments**
   (cards) and **PayNow** via a supported gateway are common. Stripe is available too.

### Step 2 — Get each product's checkout link (cart permalink)
The simplest, no-code way to jump a buyer straight to checkout is a **cart permalink**:

```
https://YOUR-STORE.myshopify.com/cart/VARIANT_ID:1
```

- `VARIANT_ID` = the numeric variant id of the product.
  Find it: **Products → open the product →** the browser URL ends in
  `.../variants/1234567890` → the id is `1234567890`.
- `:1` = quantity 1.
- Using a custom domain (e.g. `shop.benios.education`)? Swap the host accordingly.

> Tip: append `?checkout[email]=` or discount params later if you want. To skip
> the cart and go even faster, you can also use Shopify's **Buy Button** channel,
> but cart permalinks need zero extra scripts and work great here.

### Step 3 — Wire the links into the site
Open `packages.html`, find the `SHOPIFY` config near the bottom, and replace the
placeholders:

```js
const SHOPIFY = {
  starter: "https://YOUR-STORE.myshopify.com/cart/1111111111:1",
  pro:     "https://YOUR-STORE.myshopify.com/cart/2222222222:1",
  team:    "https://YOUR-STORE.myshopify.com/cart/3333333333:1",
};
```

Commit + push, and the *Enroll* buttons now send buyers to Shopify. Until you do,
the buttons show a friendly "checkout isn't connected yet" message.

### Step 4 — Send buyers back to booking after payment
Two good options:

- **Simplest — a "thank you" note with a link.**
  *Shopify admin → Settings → Checkout → Order status page → Additional scripts*,
  add:
  ```html
  <p>Thanks for enrolling! <a href="https://YOUR-GH-PAGES-URL/book.html?purchased=pro">
  Book your kickoff call →</a></p>
  ```
  `book.html` detects `?purchased=` and shows a tailored "you're in!" message.

- **Automatic redirect.** On Shopify **Plus** you can set a checkout redirect.
  On non-Plus plans, the additional-scripts link above is the practical route
  (a full auto-redirect isn't officially supported without Plus/apps).

> **"Book during payment"** — the cleanest reliable pattern is *pay → immediately
> book* (Step 4), not literally mid-checkout, because Shopify owns the checkout UI.
> The buyer's flow still feels like one continuous step: click Enroll → pay →
> land on the booking page. If you truly need booking *inside* checkout, that
> requires a Shopify app/Plus and is more work — happy to scope it if you want.

---

## 2. Calendly setup (booking)

**Goal:** buyers (and prospects) book a call from `book.html`.

1. Create a free account at [calendly.com](https://calendly.com).
2. Create an event type, e.g. **"BENIOS Onboarding — 30 min"**. Copy its link:
   `https://calendly.com/YOUR-HANDLE/onboarding`.
3. In `book.html`, find the Calendly embed and set your link:
   ```html
   <div class="calendly-inline-widget"
        data-url="https://calendly.com/YOUR-HANDLE/onboarding"
        style="min-width:320px;height:680px;"></div>
   ```
4. (Optional) Pre-fill the buyer's details from the Shopify redirect by appending
   `?name=...&email=...` to the `data-url`, or use Calendly's UTM/prefill params.
5. Connect Calendly to your Google/Outlook calendar so slots stay accurate, and
   turn on Calendly's confirmation + reminder emails.

The same embed serves both **pre-sales chats** and **post-purchase onboarding** —
just create two event types and point to whichever you want, or use one general
"Talk to us" event.

---

## 3. Email / contact form setup

**Goal:** people can email questions about a package, with no backend server.

The form in `book.html` posts to **[Formspree](https://formspree.io)** (free tier):

1. Sign up at Formspree, create a form, and copy its endpoint
   (`https://formspree.io/f/abcmyform`).
2. In `book.html`, set the form action:
   ```html
   <form action="https://formspree.io/f/abcmyform" method="POST">
   ```
3. Verify your email in Formspree so submissions reach your inbox.

**Alternatives** (all drop-in, no server): [Tally](https://tally.so),
[Getform](https://getform.io), [Web3Forms](https://web3forms.com), or a Google Form.
Plus the page already shows a `mailto:hello@benios.education` link for direct email.

> Set up the real inbox (e.g. `hello@benios.education`) via Google Workspace or
> your domain provider, then update the address across the pages.

---

## 4. Deploy (GitHub Pages)

This repo is already published via **GitHub Pages** from the `main` branch.
To update the live site: edit files, commit, and push — Pages redeploys in ~1 min.

**Custom domain:** *Repo → Settings → Pages → Custom domain*, enter your domain
(e.g. `benios.education`), then add the DNS records GitHub shows at your registrar.
A `CNAME` file will be committed automatically.

---

## Local preview

No build step. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Editing checklist before launch

- [ ] Replace Shopify variant links in `packages.html`
- [ ] Add the "thank you" link in Shopify order-status page → `book.html?purchased=...`
- [ ] Set your Calendly `data-url` in `book.html`
- [ ] Set your Formspree form id (or alt) in `book.html`
- [ ] Replace `hello@benios.education` with your real inbox everywhere
- [ ] Swap the illustrative stats on `xr-growth.html` for cited figures
- [ ] (Optional) Point a custom domain at GitHub Pages
