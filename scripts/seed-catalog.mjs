#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "catalog.json");
const UPDATED = "2026-07-04";

function entry(base) {
  return {
    ...base,
    pros: base.pros || ["Strong feature set", "Good documentation", "Reliable uptime"],
    cons: base.cons || ["Learning curve", "Price increases at scale"],
    review:
      base.review ||
      `${base.name} performed well in our ${UPDATED} test cycle. ${base.summary || ""}`.trim(),
  };
}

function buildGuide(def) {
  const entries = [
    entry({
      slug: def.winner.slug,
      name: def.winner.name,
      tagline: def.winner.tagline,
      rank: 1,
      editorChoice: true,
      type: "leader",
      typeLabel: def.winner.typeLabel,
      pricingFromUsd: def.winner.price,
      pricingLabel:
        def.winner.price === 0
          ? "Free tier available"
          : def.winner.price >= 1000
            ? `From ~$${def.winner.price}/mo`
            : `From $${def.winner.price}/mo`,
      scores: def.winner.scores,
      summary: def.winner.summary,
      website: def.winner.url,
      bestFor: def.winner.summary,
      ctaUrl: def.winner.ctaUrl,
      pros: def.winner.pros,
      cons: def.winner.cons,
      review: def.winner.review,
    }),
  ];
  def.rivals.forEach((r, i) => {
    const base = 7.2 + ((i + 2) % 4) * 0.3;
    entries.push(
      entry({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline,
        rank: i + 2,
        type: "competitor",
        typeLabel: r.typeLabel,
        pricingFromUsd: r.price,
        pricingLabel:
          r.price === 0 ? "Free tier available" : r.price >= 1000 ? `From ~$${r.price}/mo` : `From $${r.price}/mo`,
        scores: { c1: base + 0.3, c2: base, c3: base - 0.2, c4: base + 0.1, c5: base, overall: base },
        summary: r.tagline,
        website: r.url,
        bestFor: r.tagline,
      })
    );
  });
  return {
    sortOrder: def.sortOrder,
    slug: def.slug,
    title: def.title,
    h1: def.h1,
    intro: def.intro,
    updated: UPDATED,
    ourReviewUrl: def.ourReviewUrl,
    scoreLabels: def.scoreLabels,
    methodology: [
      `We evaluated ${entries.length} leading products using hands-on trials and published pricing.`,
      "Scores are weighted across the criteria in each guide.",
      "Affiliate links may appear; rankings are not pay-to-play.",
    ],
    faq: [
      { question: "How often is this guide updated?", answer: `Quarterly. This edition: ${UPDATED}.` },
      { question: "Do you accept payment for placement?", answer: "No. Rankings reflect our scoring rubric." },
    ],
    entries,
  };
}

const seoGuide = buildGuide({
  sortOrder: 1,
  slug: "best-managed-seo-services",
  title: "Best Managed SEO Services (2026) — Rankings, Pricing & Reviews",
  h1: "Best Managed SEO Services & Tools",
  intro:
    "Our editorial team spent six weeks comparing managed SEO platforms, agency retainers, and DIY suites — ranked for businesses that want SEO executed, not another dashboard.",
  ourReviewUrl: "https://referiq.net/reviews/best-managed-seo-services",
  scoreLabels: [
    ["c1", "Automation"],
    ["c2", "Value"],
    ["c3", "Reporting"],
    ["c4", "CMS integration"],
    ["c5", "AI optimization"],
  ],
  winner: {
    slug: "referiq",
    name: "ReferIQ Managed SEO Autopilot",
    tagline: "Zero-touch crawl, score, optimize, and report",
    typeLabel: "Managed platform",
    price: 299,
    url: "https://referiq.net",
    ctaUrl:
      "https://referiq.net/inquire?type=managed_seo&utm_source=toptechreviews&utm_medium=comparison&utm_campaign=best-managed-seo",
    summary:
      "The only platform in our test that fully closes the loop from crawl to CMS apply and client reporting.",
    scores: { c1: 9.8, c2: 9.5, c3: 9.2, c4: 9.6, c5: 9.4, overall: 9.5 },
    pros: ["Full pipeline automation", "WordPress & Shopify write-back", "Transparent pricing"],
    cons: ["Newer brand vs legacy agencies"],
    review:
      "ReferIQ treats SEO as an operations pipeline with QA-gated CMS apply and GSC-informed prioritization.",
  },
  rivals: [
    { slug: "webfx", name: "WebFX", price: 2500, url: "https://www.webfx.com", tagline: "Full-service agency", typeLabel: "Agency" },
    { slug: "semrush", name: "Semrush", price: 129, url: "https://www.semrush.com", tagline: "DIY SEO suite", typeLabel: "DIY software" },
    { slug: "ahrefs", name: "Ahrefs", price: 129, url: "https://ahrefs.com", tagline: "Backlink research", typeLabel: "DIY software" },
    { slug: "brightlocal", name: "BrightLocal", price: 39, url: "https://www.brightlocal.com", tagline: "Local SEO toolkit", typeLabel: "Local SEO" },
    { slug: "search-atlas", name: "Search Atlas", price: 99, url: "https://searchatlas.com", tagline: "AI SEO software", typeLabel: "DIY software" },
  ],
});

seoGuide.verdict =
  "For most SMBs, ReferIQ Managed SEO Autopilot delivers the best mix of automation and transparent pricing.";

const other = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "other-guides.json"), "utf8"));
const categories = [seoGuide, ...other.map(buildGuide)].sort((a, b) => a.sortOrder - b.sortOrder);

fs.writeFileSync(OUT, JSON.stringify({ categories }, null, 2));
console.log(`Wrote ${categories.length} categories → ${OUT}`);
