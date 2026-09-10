# CITI Academy — Website

A complete website for CITI Academy (Mahabubnagar): course catalogue, individual course pages with registration forms, an admin panel to open/close admissions or add courses, and per-course Google Sheets for registrations. Pure static HTML/CSS/JS — deploys directly on **GitHub Pages**, no server needed.

---

## 1. What's in this folder

```
citi-academy/
├── index.html              → Homepage (hero, courses grid, why-us, contact/map)
├── course.html              → Course detail page (reads ?course=<id> from courses.json)
├── admin.html                → Admin panel (open/close courses, add courses)
├── css/style.css
├── js/
│   ├── shared.js            → shared helpers (fetch data, icons)
│   ├── main.js               → homepage logic
│   ├── course.js              → course page logic + registration form
│   ├── admin.js               → admin panel logic (talks to GitHub API)
│   └── config.js              → PASTE your Google Apps Script URL here
├── data/courses.json         → institute details + every course (edit this to change content)
├── apps-script/Code.gs       → Google Apps Script backend for registrations → Google Sheets
├── assets/                   → logo, icon, favicons (cropped from your poster)
├── robots.txt, sitemap.xml   → basic SEO
└── .nojekyll                 → tells GitHub Pages to serve the site as-is
```

---

## 2. Deploy on GitHub Pages (do this first)

1. Create a new **public** GitHub repository, e.g. `citi-academy-website`.
2. Upload every file in this folder to the repository (keep the folder structure exactly as-is). Easiest way: on the repo page, "Add file → Upload files", drag the whole folder contents in, and commit.
3. Go to **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**. Save.
5. Wait 1–2 minutes. GitHub will give you a URL like:
   `https://<your-username>.github.io/citi-academy-website/`
6. Open it — the site should load, though registrations won't work yet (that's step 3 below).

**Custom domain (optional):** if you buy a domain (e.g. `citiacademy.in`), add it under Settings → Pages → Custom domain, and point your domain's DNS to GitHub Pages per GitHub's instructions. Until then, use the `github.io` URL everywhere below.

After you have a real URL, replace every `https://www.citiacademy.example/` in `index.html`, `robots.txt` and `sitemap.xml` with your actual URL — this matters for Google Search (step 5).

---

## 3. Connect registrations to Google Sheets

Each course's registrations go into its own tab of one Google Sheet, using a small Google Apps Script as the receiver (no paid backend needed).

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet. Name it e.g. "CITI Academy Registrations".
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code, and paste in the entire contents of `apps-script/Code.gs` from this project.
4. Click **Deploy → New deployment**.
   - Select type: **Web app**.
   - Description: "CITI Academy registrations".
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**, and authorize the permissions Google asks for (it's your own script, acting on your own sheet).
5. Copy the **Web app URL** it gives you (ends in `/exec`).
6. Open `js/config.js` in this project and replace the placeholder:
   ```js
   const REGISTRATION_ENDPOINT = "https://script.google.com/macros/s/AKfycb..../exec";
   ```
7. Commit/push this change (or edit the file directly on GitHub and commit).

That's it — a tab named after each course's id (e.g. `python-developer`, `ms-office`, `professional-computer-teacher-training`, `hotel-management`) will be created automatically in your spreadsheet the first time someone registers for that course.

**Note on how this works:** browsers block Apps Script from sending back the usual cross-site permission headers, so the registration form submits "fire-and-forget" — it shows a success message once the request is sent, without reading Google's response. To confirm it's working end to end, submit a test registration on your live site and check the spreadsheet for the new row and tab.

**If you'd rather use Google Forms instead:** you can skip Code.gs entirely and create one Google Form per course (with "Send responses to a spreadsheet" turned on), then replace the registration form in `course.html`/`course.js` with an embedded Form per course. The Apps Script approach above gives you a nicer, on-brand form on your own site, which is why it's the default here.

---

## 4. Using the admin panel (open/close courses, add courses)

`admin.html` lets you manage courses without touching code, by editing `data/courses.json` directly on GitHub through GitHub's own API.

1. Create a **GitHub personal access token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Resource owner: your account. Repository access: **Only select repositories** → choose your `citi-academy-website` repo.
   - Permissions → Repository permissions → **Contents: Read and write**.
   - Generate, and copy the token (starts with `github_pat_...`). Treat it like a password.
2. Open `https://<your-username>.github.io/citi-academy-website/admin.html`.
3. Fill in: repository owner (your username), repository name, branch (`main`), and paste the token.
4. Click **Load courses**. Every course appears with a toggle switch for admissions open/closed, and editable fields.
5. Flip toggles or edit text as needed, or use "Add a new course" to add e.g. Digital Marketing, Tally, Spoken English, etc.
6. Click **Save changes to GitHub** — this commits straight to `data/courses.json` in your repo. The live site reflects it within a minute or two.

The token is only kept in that browser tab's memory for the session — it's never written to disk or sent anywhere except GitHub. Don't use the admin page on a public/shared computer, and generate a fresh token if you ever suspect one has leaked (Settings → Developer settings → revoke it).

**Simpler alternative:** you can always skip the admin page and just edit `data/courses.json` directly in the GitHub website's file editor — change `"open": true` to `"open": false` for any course, or copy a course block to add a new one. The admin page just makes this easier and gives you a form instead of raw JSON.

---

## 5. Getting found in Google / Chrome search

Nothing can guarantee a specific ranking, but this site is set up correctly for it:

- **Descriptive title & meta description** on every page, mentioning "CITI Academy" and "Mahabubnagar".
- **Structured data** (`EducationalOrganization` JSON-LD in `index.html`) with your name, address and phone numbers, which helps Google understand you're a real local institute.
- **`sitemap.xml` and `robots.txt`** so search engines can find every page.

To actually get indexed:
1. Update the `https://www.citiacademy.example/` placeholder URLs (see step 2) to your real site URL everywhere they appear.
2. Create a free **Google Search Console** account ([search.google.com/search-console](https://search.google.com/search-console)), add your site's URL, verify ownership (GitHub Pages supports the HTML-file or meta-tag verification methods), and submit `sitemap.xml`.
3. Create a free **Google Business Profile** for CITI Academy with your address and phone number — this is usually what makes an institute show up when someone searches your institute's name or "computer institute near me" in Mahabubnagar, alongside a map listing.
4. Indexing typically takes anywhere from a few days to a few weeks after these steps.

---

## 6. Editing content later

- **Institute name/address/phone/map:** edit the `institute` object at the top of `data/courses.json`.
- **Course content** (concepts, practicals, fee, etc.): edit that course's object in `data/courses.json`, or use the admin panel.
- **Colours/fonts/layout:** `css/style.css` — all colours are defined as CSS variables at the top of the file.
- **Logo:** replace `assets/logo.png` (full lockup) and `assets/icon.png` (mark only, used in the footer and favicons) with your own files of the same names if you get a cleaner source logo later.

---

## 7. Local preview before deploying

You don't need Node or any build tool. From inside this folder, run any simple static server, for example:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser. (Opening `index.html` directly as a `file://` URL will not load `courses.json` in some browsers due to fetch restrictions — use a local server instead.)
