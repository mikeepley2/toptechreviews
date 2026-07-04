#!/usr/bin/env node
/** Generate static HTML from content/categories/*.json */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(ROOT, "assets");

const site = JSON.parse(fs.readFileSync(path.join(CONTENT, "site.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(CONTENT, "catalog.json"), "utf8"));
const categories = catalog.categories;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function outboundHref(entry, category) {
  const url = entry.ctaUrl || entry.website;
  return `/go/${category.slug}/${entry.slug}`;
}

function inquiryAttrs(categorySlug) {
  return `class="btn btn-inquiry outbound" data-category="${escapeHtml(categorySlug || "site")}" data-vendor="editorial-inquiry" rel="noopener"`;
}

function renderInquiryButton(categorySlug, compact) {
  if (!site.inquiryUrl) return "";
  const cls = compact ? "inquiry-link" : "btn btn-inquiry";
  const attrs = compact
    ? `class="${cls} outbound" data-category="${escapeHtml(categorySlug || "site")}" data-vendor="editorial-inquiry" rel="noopener"`
    : inquiryAttrs(categorySlug);
  return `<a href="${escapeHtml(site.inquiryUrl)}" ${attrs}>${escapeHtml(site.inquiryLabel || "Submit inquiry")} →</a>`;
}

function renderInquirySection(categorySlug, id) {
  if (!site.inquiryUrl) return "";
  const anchor = id ? ` id="${id}"` : "";
  return `<section class="inquiry-section"${anchor}>
    <div class="inquiry-inner">
      <div>
        <p class="eyebrow">For vendors &amp; readers</p>
        <h2>${escapeHtml(site.inquiryHeadline || "Submit an inquiry")}</h2>
        <p>${escapeHtml(site.inquiryText || "")}</p>
      </div>
      <div class="inquiry-actions">
        ${renderInquiryButton(categorySlug)}
      </div>
    </div>
  </section>`;
}

function renderFooter(extraLinks = "") {
  const inquiryLink = site.inquiryUrl
    ? `<a href="${escapeHtml(site.inquiryUrl)}" class="outbound" data-category="site" data-vendor="editorial-inquiry" rel="noopener">${escapeHtml(site.inquiryLabel || "Submit inquiry")}</a>`
    : "";
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div>
        <p class="logo">${escapeHtml(site.name)}</p>
        <p>${escapeHtml(site.tagline)}</p>
      </div>
      <div class="footer-links">
        ${extraLinks}
        ${inquiryLink}
      </div>
    </div>
    <p class="footer-note">${escapeHtml(site.footerNote)}</p>
  </footer>`;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function scoreBar(value, highlight) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const bar = highlight ? "bg-amber-500" : "bg-stone-400";
  const num = highlight ? "font-bold text-amber-700" : "text-stone-500";
  return `<div class="score-bar"><div class="score-track"><div class="score-fill ${bar}" style="width:${pct}%"></div></div><span class="score-num ${num}">${Number(value).toFixed(1)}</span></div>`;
}

function renderComparisonPage(cat) {
  const sorted = [...cat.entries].sort((a, b) => a.rank - b.rank);
  const winner = sorted.find((e) => e.editorChoice) || sorted[0];
  const scoreKeys = cat.scoreLabels || [];

  const providerLinks = sorted
    .map(
      (e) => `<li class="provider-row${e.editorChoice ? " winner-row" : ""}">
      <div><strong>${escapeHtml(e.name)}</strong>${e.editorChoice ? ' <span class="badge">Best overall</span>' : ""}</div>
      <a href="${outboundHref(e, cat)}" class="outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="${escapeHtml(e.slug)}" rel="noopener noreferrer sponsored">Visit →</a>
    </li>`
    )
    .join("\n");

  const tableRows = sorted
    .map(
      (e) => `<tr class="${e.editorChoice ? "row-winner" : ""}">
      <td>${e.rank}</td>
      <td><a href="#review-${e.slug}">${escapeHtml(e.name)}</a></td>
      <td>${escapeHtml(e.typeLabel || e.type)}</td>
      <td>${escapeHtml(e.pricingLabel)}</td>
      <td><strong>${e.scores.overall.toFixed(1)}</strong></td>
      <td><a href="${outboundHref(e, cat)}" class="outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="${escapeHtml(e.slug)}" rel="noopener noreferrer sponsored">Visit →</a></td>
    </tr>`
    )
    .join("\n");

  const scoreBreakdown = sorted
    .slice(0, 4)
    .map((e) => {
      const bars = scoreKeys
        .map(([key, label]) => `<div><dt>${escapeHtml(label)}</dt><dd>${scoreBar(e.scores[key] ?? 0, e.editorChoice)}</dd></div>`)
        .join("");
      return `<div class="score-card${e.editorChoice ? " score-card-winner" : ""}">
        <h3>${escapeHtml(e.name)}</h3>
        <p class="muted">${escapeHtml(e.pricingLabel)}</p>
        <dl>${bars}</dl>
      </div>`;
    })
    .join("\n");

  const reviews = sorted
    .map(
      (e) => `<article id="review-${e.slug}" class="review-card${e.editorChoice ? " review-winner" : ""}">
      <div class="meta">${e.editorChoice ? '<span class="badge">#1 Pick</span>' : `<span class="rank">#${e.rank}</span>`} · ${escapeHtml(e.typeLabel || e.type)} · ${escapeHtml(e.pricingLabel)}</div>
      <h3>${escapeHtml(e.name)}</h3>
      <p class="tagline">${escapeHtml(e.tagline)}</p>
      <p>${escapeHtml(e.review)}</p>
      <div class="pros-cons">
        <div><h4>Pros</h4><ul>${(e.pros || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul></div>
        <div><h4>Cons</h4><ul>${(e.cons || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>
      </div>
      <p><strong>Best for:</strong> ${escapeHtml(e.bestFor)}</p>
      <a href="${outboundHref(e, cat)}" class="btn${e.editorChoice ? " btn-primary" : " btn-secondary"} outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="${escapeHtml(e.slug)}" rel="noopener noreferrer sponsored">${e.editorChoice ? "See pricing & plans →" : `Visit ${escapeHtml(e.name.split(" ")[0])} →`}</a>
    </article>`
    )
    .join("\n");

  const faq = (cat.faq || [])
    .map((f) => `<div><dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd></div>`)
    .join("\n");

  const methodology = (cat.methodology || [])
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("\n");

  const ourReview = cat.ourReviewUrl
    ? `<p class="partner-review"><a href="${escapeHtml(cat.ourReviewUrl)}" class="outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="our-full-review" rel="noopener">Read our extended review on ReferIQ →</a></p>`
    : "";

  const canonical = `${site.url}/reviews/${cat.slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(cat.title)} | ${escapeHtml(site.name)}</title>
  <meta name="description" content="${escapeHtml(cat.metaDescription || cat.intro.slice(0, 155))}">
  <link rel="canonical" href="${canonical}">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta name="toptechreviews:tracking" content="${escapeHtml(site.trackingEndpoint || "/api/click")}">
  <script defer src="/assets/tracker.js"></script>
  <meta name="toptechreviews:category" content="${escapeHtml(cat.slug)}">
</head>
<body>
  <header class="site-header">
    <div class="masthead-bar">Updated ${escapeHtml(cat.updated)} · ${sorted.length} providers · <a href="#methodology">Methodology</a></div>
    <div class="header-inner">
      <div><a href="/" class="logo">${escapeHtml(site.name)}</a><p class="tagline">${escapeHtml(site.tagline)}</p></div>
      <nav><a href="/">All guides</a><a href="#rankings">Rankings</a><a href="#reviews">Reviews</a><a href="#faq">FAQ</a>${site.inquiryUrl ? `<a href="${escapeHtml(site.inquiryUrl)}" class="outbound nav-inquiry" data-category="${escapeHtml(cat.slug)}" data-vendor="editorial-inquiry" rel="noopener">${escapeHtml(site.inquiryLabel || "Submit inquiry")}</a>` : ""}</nav>
    </div>
  </header>
  <main class="container">
    <article class="hero">
      <p class="eyebrow">2026 Buyer&apos;s Guide</p>
      <h1>${escapeHtml(cat.h1)}</h1>
      <p class="lead">${escapeHtml(cat.intro)}</p>
      <p class="byline">By ${escapeHtml(site.publisher)} · Independent testing · Affiliate links may appear below</p>
      ${ourReview}
    </article>

    <section class="winner-box">
      <div class="winner-banner">Our top pick</div>
      <div class="winner-body">
        <span class="badge">#1 Pick</span>
        <h2>${escapeHtml(winner.name)}</h2>
        <p class="tagline">${escapeHtml(winner.tagline)}</p>
        <p>${escapeHtml(winner.summary)}</p>
        <p class="price">${escapeHtml(winner.pricingLabel)}</p>
        <a href="${outboundHref(winner, cat)}" class="btn btn-primary outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="${escapeHtml(winner.slug)}" rel="noopener noreferrer sponsored">See pricing &amp; plans →</a>
      </div>
    </section>

    <section><h2>All providers in this guide</h2><ul class="provider-list">${providerLinks}</ul></section>

    <section id="rankings">
      <h2>Full rankings</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Provider</th><th>Category</th><th>Pricing</th><th>Score</th><th></th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table></div>
    </section>

    <section><h2>Score breakdown — top 4</h2><div class="score-grid">${scoreBreakdown}</div></section>

    <section id="methodology" class="methodology"><h2>How we tested</h2><ul>${methodology}</ul>
      <p class="disclosure">${escapeHtml(site.disclosure)}</p>
    </section>

    <section id="reviews"><h2>In-depth reviews</h2>${reviews}</section>

    <section id="faq" class="faq"><h2>FAQ</h2><dl>${faq}</dl></section>

    <section class="verdict">
      <h2>The verdict</h2>
      <p>${escapeHtml(cat.verdict || `For most buyers in this category, ${winner.name} offers the best balance of features, value, and ease of use.`)}</p>
      <a href="${outboundHref(winner, cat)}" class="btn btn-primary outbound" data-category="${escapeHtml(cat.slug)}" data-vendor="${escapeHtml(winner.slug)}" rel="noopener noreferrer sponsored">Visit our #1 pick →</a>
    </section>

    ${renderInquirySection(cat.slug)}
  </main>
  ${renderFooter(`<a href="/">All guides</a><a href="#methodology">Methodology</a>`)}
  <script type="application/json" id="outbound-map">${JSON.stringify(
    Object.fromEntries(
      sorted.flatMap((e) => [
        [`${cat.slug}/${e.slug}`, e.ctaUrl || e.website],
      ])
    )
  )}</script>
</body>
</html>`;
}

function renderIndex(categories) {
  const featured = categories.find((c) => c.slug === "best-managed-seo-services") || categories[0];
  const groups = {};
  for (const c of categories) {
    const g = c.categoryGroup || "Other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  }
  const groupOrder = [
    "Marketing & Growth",
    "Sales & CRM",
    "Productivity",
    "Developer & IT",
    "Security & Privacy",
    "Communication",
    "Finance & Accounting",
    "Commerce & Retail",
    "Customer Support",
    "Web & Design",
    "HR & People",
    "AI & Automation",
    "Legal & Compliance",
    "Other",
  ];
  const sortedGroups = groupOrder.filter((g) => groups[g]?.length);

  const navPills = sortedGroups
    .map((g) => `<a class="cat-nav-pill" href="#cat-${slugify(g)}">${escapeHtml(g)} <span class="pill-count">${groups[g].length}</span></a>`)
    .join("\n");

  const sections = sortedGroups
    .map((g) => {
      const cards = groups[g]
        .map((c) => {
          const winner = c.entries?.find((e) => e.editorChoice) || c.entries?.[0];
          return `<a class="cat-card" href="/reviews/${c.slug}/" data-title="${escapeHtml(c.h1.toLowerCase())}" data-group="${escapeHtml(g.toLowerCase())}">
        <div class="cat-card-top">
          <span class="cat-group-label">${escapeHtml(g)}</span>
          <span class="cat-updated">Updated ${escapeHtml(c.updated)}</span>
        </div>
        <h2>${escapeHtml(c.h1)}</h2>
        <p>${escapeHtml(c.intro.slice(0, 120))}…</p>
        ${winner ? `<p class="cat-winner"><span class="cat-winner-label">Top pick</span> ${escapeHtml(winner.name)}</p>` : ""}
        <span class="cat-link">Read full guide →</span>
      </a>`;
        })
        .join("\n");
      return `<section class="cat-section" id="cat-${slugify(g)}">
      <div class="cat-section-head">
        <h2>${escapeHtml(g)}</h2>
        <span class="cat-section-count">${groups[g].length} guides</span>
      </div>
      <div class="cat-grid">${cards}</div>
    </section>`;
    })
    .join("\n");

  const winner = featured.entries?.find((e) => e.editorChoice) || featured.entries?.[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(site.name)} — Independent tech buyer guides</title>
  <meta name="description" content="${escapeHtml(site.description)}">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta name="toptechreviews:tracking" content="${escapeHtml(site.trackingEndpoint || "/api/click")}">
  <script defer src="/assets/tracker.js"></script>
</head>
<body>
  <header class="site-header site-header-home">
    <div class="masthead-bar">Independent research · ${categories.length} buyer guides · Updated ${escapeHtml(featured.updated)}</div>
    <div class="header-inner">
      <div class="brand-block">
        <a href="/" class="logo">${escapeHtml(site.name)}</a>
        <p class="tagline">${escapeHtml(site.tagline)}</p>
      </div>
      <nav class="header-nav">
        <a href="#categories">Browse categories</a>
        <a href="#featured">Featured</a>
        <a href="#methodology-home">Methodology</a>
        <a href="#inquiry">${escapeHtml(site.inquiryLabel || "Submit inquiry")}</a>
      </nav>
      ${site.inquiryUrl ? `<div class="header-cta">${renderInquiryButton("site")}</div>` : ""}
    </div>
  </header>
  <main class="container container-wide">
    <section class="hero hero-home">
      <p class="eyebrow">2026 Technology Buyer's Guides</p>
      <h1>Find the right software with independent, side-by-side reviews</h1>
      <p class="lead">${escapeHtml(site.description)}</p>
      <div class="hero-stats">
        <div class="stat"><strong>${categories.length}</strong><span>Buyer guides</span></div>
        <div class="stat"><strong>${sortedGroups.length}</strong><span>Categories</span></div>
        <div class="stat"><strong>6+</strong><span>Providers per guide</span></div>
      </div>
      <div class="search-wrap">
        <label for="guide-search" class="sr-only">Search guides</label>
        <input type="search" id="guide-search" class="guide-search" placeholder="Search guides (e.g. CRM, VPN, payroll)…" autocomplete="off">
      </div>
    </section>

    <nav class="cat-nav" id="categories" aria-label="Guide categories">
      ${navPills}
    </nav>

    <section class="featured-guide" id="featured">
      <div class="featured-label">Editor's featured guide</div>
      <div class="featured-body">
        <div>
          <p class="eyebrow">${escapeHtml(featured.categoryGroup || "Featured")}</p>
          <h2>${escapeHtml(featured.h1)}</h2>
          <p>${escapeHtml(featured.intro.slice(0, 200))}…</p>
          ${winner ? `<p class="featured-winner">Our #1 pick: <strong>${escapeHtml(winner.name)}</strong></p>` : ""}
        </div>
        <div class="featured-actions">
          <a href="/reviews/${featured.slug}/" class="btn btn-primary">Read the full guide →</a>
          ${featured.ourReviewUrl ? `<a href="${escapeHtml(featured.ourReviewUrl)}" class="btn btn-secondary outbound" data-category="${escapeHtml(featured.slug)}" data-vendor="featured-review" rel="noopener">Extended review →</a>` : ""}
        </div>
      </div>
    </section>

    ${sections}

    ${renderInquirySection("site", "inquiry")}

    <section class="methodology methodology-home" id="methodology-home">
      <h2>How we rank software</h2>
      <div class="methodology-grid">
        <div><h3>Hands-on evaluation</h3><p>Each guide compares six leading products using published pricing, feature testing, and integration checks.</p></div>
        <div><h3>Weighted scoring</h3><p>Providers receive scores across five category-specific criteria plus an overall rating out of 10.</p></div>
        <div><h3>Transparent disclosure</h3><p>Rankings are editorial — not pay-to-play. Outbound links may include affiliate relationships where noted.</p></div>
      </div>
      <p class="disclosure">${escapeHtml(site.disclosure)}</p>
    </section>
  </main>
  ${renderFooter(`<a href="#categories">Categories</a><a href="#featured">Featured guide</a><a href="#methodology-home">Methodology</a><a href="#inquiry">${escapeHtml(site.inquiryLabel || "Submit inquiry")}</a>`)}
  <script>
    (function () {
      var input = document.getElementById("guide-search");
      var cards = document.querySelectorAll(".cat-card");
      var sections = document.querySelectorAll(".cat-section");
      if (!input) return;
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var title = card.getAttribute("data-title") || "";
          var group = card.getAttribute("data-group") || "";
          var match = !q || title.indexOf(q) !== -1 || group.indexOf(q) !== -1;
          card.style.display = match ? "" : "none";
        });
        sections.forEach(function (section) {
          var visible = section.querySelectorAll('.cat-card:not([style*="none"])').length;
          section.style.display = visible ? "" : "none";
        });
      });
      document.querySelectorAll('.cat-nav-pill').forEach(function (pill) {
        pill.addEventListener("click", function () {
          document.querySelectorAll('.cat-nav-pill').forEach(function (p) { p.classList.remove('active'); });
          pill.classList.add('active');
        });
      });
    })();
  </script>
</body>
</html>`;
}

function renderGoRedirect(categories) {
  const lines = ["/* Cloudflare Pages _redirects — optional; prefer Worker for click logging */"];
  for (const cat of categories) {
    for (const e of cat.entries) {
      const dest = encodeURIComponent(e.ctaUrl || e.website);
      lines.push(`/go/${cat.slug}/${e.slug}  ${e.ctaUrl || e.website}  302`);
    }
  }
  return lines.join("\n");
}

function renderGoPage() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Redirecting…</title><script src="/assets/go.js"></script></head>
<body><p>Redirecting…</p></body></html>`;
}

function renderSitemap(categories) {
  const base = site.url.replace(/\/$/, "");
  const urls = [
    { loc: `${base}/`, priority: "1.0" },
    ...categories.map((c) => ({
      loc: `${base}/reviews/${c.slug}/`,
      priority: c.slug === "best-managed-seo-services" ? "0.9" : "0.8",
    })),
  ];
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function renderRobotsTxt() {
  const base = site.url.replace(/\/$/, "");
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}

// --- main ---
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
fs.mkdirSync(path.join(DIST, "reviews"), { recursive: true });

for (const cat of categories) {
  const dir = path.join(DIST, "reviews", cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderComparisonPage(cat));
}

fs.writeFileSync(path.join(DIST, "index.html"), renderIndex(categories));
fs.copyFileSync(path.join(ASSETS, "styles.css"), path.join(DIST, "assets", "styles.css"));
fs.copyFileSync(path.join(ASSETS, "tracker.js"), path.join(DIST, "assets", "tracker.js"));
fs.copyFileSync(path.join(ASSETS, "go.js"), path.join(DIST, "assets", "go.js"));
fs.writeFileSync(path.join(DIST, "_redirects"), renderGoRedirect(categories));
fs.writeFileSync(path.join(DIST, "sitemap.xml"), renderSitemap(categories));
fs.writeFileSync(path.join(DIST, "robots.txt"), renderRobotsTxt());
fs.mkdirSync(path.join(DIST, "go"), { recursive: true });
fs.writeFileSync(path.join(DIST, "go", "index.html"), renderGoPage());

console.log(`Built ${categories.length} guides → ${DIST}`);
