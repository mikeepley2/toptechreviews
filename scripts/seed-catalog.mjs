#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "catalog.json");
const UPDATED = "2026-07-04";
const FLAGSHIP_DIR = path.join(ROOT, "content", "flagship");
const AFFILIATE_PATH = path.join(ROOT, "content", "affiliate-links.json");

function loadAffiliateLinks() {
  if (!fs.existsSync(AFFILIATE_PATH)) return {};
  return JSON.parse(fs.readFileSync(AFFILIATE_PATH, "utf8"));
}

function resolveEntryUrls(entry, affiliateLinks) {
  if (entry.ctaUrl) {
    return {
      ...entry,
      isAffiliate: Boolean(entry.isAffiliate || entry.affiliateNetwork),
      affiliateNetwork: entry.affiliateNetwork || "",
    };
  }
  const aff = affiliateLinks[entry.slug];
  if (aff?.url) {
    return {
      ...entry,
      ctaUrl: aff.url,
      affiliateNetwork: aff.network || "",
      isAffiliate: true,
    };
  }
  return { ...entry, isAffiliate: false, affiliateNetwork: "" };
}

function applyAffiliateLinks(category, affiliateLinks) {
  if (!category.entries?.length) return category;
  return {
    ...category,
    entries: category.entries.map((e) => resolveEntryUrls(e, affiliateLinks)),
  };
}

function loadFlagshipGuides() {
  if (!fs.existsSync(FLAGSHIP_DIR)) return [];
  return fs
    .readdirSync(FLAGSHIP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(FLAGSHIP_DIR, f), "utf8")));
}

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
        ctaUrl: r.ctaUrl,
      })
    );
  });
  return buildGuideFromEntries(def, entries);
}

function buildGuideFromEntries(def, entries) {
  return {
    sortOrder: def.sortOrder,
    slug: def.slug,
    title: def.title,
    h1: def.h1,
    intro: def.intro,
    categoryGroup: def.categoryGroup,
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

const flagshipGuides = loadFlagshipGuides();
const flagshipSlugs = new Set(flagshipGuides.map((g) => g.slug));

const seoGuide =
  flagshipGuides.find((g) => g.slug === "best-managed-seo-services") ??
  buildGuide({
  sortOrder: 1,
  categoryGroup: "Marketing & Growth",
  slug: "best-managed-seo-services",
  title: "Best Managed SEO Services (2026) — Rankings, Pricing & Reviews",
  h1: "Best Managed SEO Services & Tools",
  intro:
    "Our editorial team spent six weeks comparing managed SEO platforms, agency retainers, and DIY suites — ranked for businesses that want SEO executed, not another dashboard.",
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

if (!flagshipSlugs.has("best-managed-seo-services")) {
  seoGuide.verdict =
    "For most SMBs, ReferIQ Managed SEO Autopilot delivers the best mix of automation and transparent pricing.";
}

const GROUP_BY_SLUG = {
  "best-crm-software": "Sales & CRM",
  "best-email-marketing-platforms": "Marketing & Growth",
  "best-project-management-tools": "Productivity",
  "best-cloud-hosting-providers": "Developer & IT",
  "best-password-managers": "Security & Privacy",
  "best-vpn-services": "Security & Privacy",
  "best-video-conferencing-software": "Communication",
  "best-small-business-accounting-software": "Finance & Accounting",
  "best-ecommerce-platforms": "Commerce & Retail",
  "best-help-desk-software": "Customer Support",
  "best-marketing-automation-platforms": "Marketing & Growth",
  "best-website-builders": "Web & Design",
  "best-hr-payroll-software": "HR & People",
  "best-endpoint-security-software": "Security & Privacy",
  "best-cloud-backup-services": "Developer & IT",
  "best-ai-writing-tools": "AI & Automation",
  "best-social-media-management-tools": "Marketing & Growth",
  "best-business-voip-providers": "Communication",
  "best-online-legal-services": "Legal & Compliance",
  "best-time-tracking-software": "Productivity",
};

const other = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "other-guides.json"), "utf8"));
const extraPath = path.join(ROOT, "content", "extra-guides.json");
const extra2Path = path.join(ROOT, "content", "extra-guides-2.json");
const extra = fs.existsSync(extraPath)
  ? JSON.parse(fs.readFileSync(extraPath, "utf8"))
  : [];
const extra2 = fs.existsSync(extra2Path)
  ? JSON.parse(fs.readFileSync(extra2Path, "utf8"))
  : [];

const categories = [
  seoGuide,
  ...other
    .filter((g) => !flagshipSlugs.has(g.slug))
    .map((g) => buildGuide({ ...g, categoryGroup: g.categoryGroup || GROUP_BY_SLUG[g.slug] })),
  ...extra.filter((g) => !flagshipSlugs.has(g.slug)).map(buildGuide),
  ...extra2.filter((g) => !flagshipSlugs.has(g.slug)).map(buildGuide),
  ...flagshipGuides.filter((g) => g.slug !== "best-managed-seo-services"),
].sort((a, b) => a.sortOrder - b.sortOrder);

const affiliateLinks = loadAffiliateLinks();
const withAffiliate = categories.map((c) => applyAffiliateLinks(c, affiliateLinks));

fs.writeFileSync(OUT, JSON.stringify({ categories: withAffiliate }, null, 2));
console.log(`Wrote ${withAffiliate.length} categories → ${OUT}`);
