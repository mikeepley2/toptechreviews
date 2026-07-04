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
      <nav><a href="/">All guides</a><a href="#rankings">Rankings</a><a href="#reviews">Reviews</a><a href="#faq">FAQ</a></nav>
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
  </main>
  <footer class="site-footer">
    <p class="logo">${escapeHtml(site.name)}</p>
    <p>${escapeHtml(site.tagline)}</p>
    <p>${escapeHtml(site.footerNote)}</p>
  </footer>
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
  const cards = categories
    .map(
      (c) => `<a class="cat-card" href="/reviews/${c.slug}/">
      <span class="cat-updated">Updated ${escapeHtml(c.updated)}</span>
      <h2>${escapeHtml(c.h1)}</h2>
      <p>${escapeHtml(c.intro.slice(0, 140))}…</p>
      <span class="cat-link">Read guide →</span>
    </a>`
    )
    .join("\n");

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
  <header class="site-header">
    <div class="header-inner">
      <div><a href="/" class="logo">${escapeHtml(site.name)}</a><p class="tagline">${escapeHtml(site.tagline)}</p></div>
    </div>
  </header>
  <main class="container">
    <section class="hero">
      <h1>Top technology picks, tested independently</h1>
      <p class="lead">${escapeHtml(site.description)}</p>
    </section>
    <section class="cat-grid">${cards}</section>
  </main>
  <footer class="site-footer">
    <p class="logo">${escapeHtml(site.name)}</p>
    <p>${escapeHtml(site.footerNote)}</p>
  </footer>
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
fs.mkdirSync(path.join(DIST, "go"), { recursive: true });
fs.writeFileSync(path.join(DIST, "go", "index.html"), renderGoPage());

console.log(`Built ${categories.length} guides → ${DIST}`);
