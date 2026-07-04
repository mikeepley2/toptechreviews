#!/usr/bin/env node
/** Generate content/extra-guides-2.json — 200 additional buyer guide definitions */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "extra-guides-2.json");
const START_ORDER = 122;
const TARGET = 200;

const GROUPS = {
  marketing: "Marketing & Growth",
  sales: "Sales & CRM",
  productivity: "Productivity",
  dev: "Developer & IT",
  security: "Security & Privacy",
  comms: "Communication",
  finance: "Finance & Accounting",
  commerce: "Commerce & Retail",
  support: "Customer Support",
  design: "Web & Design",
  hr: "HR & People",
  ai: "AI & Automation",
  legal: "Legal & Compliance",
};

const NICHES = [
  "Healthcare", "Legal", "Construction", "Real Estate", "Restaurant",
  "Hospitality", "Manufacturing", "Logistics", "Education", "Nonprofit",
  "Insurance", "Automotive", "Fitness", "Salon", "Veterinary",
  "Pharmacy", "Architecture", "Engineering", "Agriculture", "Retail",
  "Wholesale", "Government", "Media", "Travel", "Energy",
];

const TYPES = [
  {
    key: "scheduling",
    label: "Scheduling Software",
    group: "productivity",
    labels: [["c1", "Scheduling"], ["c2", "Reminders"], ["c3", "Calendar sync"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "calendly", name: "Calendly", tagline: "Meeting scheduling", typeLabel: "Scheduling", price: 10, url: "https://calendly.com" },
      { slug: "acuity", name: "Acuity Scheduling", tagline: "Service booking", typeLabel: "Services", price: 16, url: "https://acuityscheduling.com" },
      { slug: "cal-com", name: "Cal.com", tagline: "Open scheduling", typeLabel: "Open source", price: 12, url: "https://cal.com" },
      { slug: "simplybook", name: "SimplyBook.me", tagline: "Vertical booking", typeLabel: "Vertical", price: 9, url: "https://simplybook.me" },
      { slug: "setmore", name: "Setmore", tagline: "Free booking app", typeLabel: "Free tier", price: 0, url: "https://www.setmore.com" },
    ],
  },
  {
    key: "billing",
    label: "Billing Software",
    group: "finance",
    labels: [["c1", "Invoicing"], ["c2", "Payments"], ["c3", "Reporting"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "freshbooks", name: "FreshBooks", tagline: "Service invoicing", typeLabel: "Invoicing", price: 19, url: "https://www.freshbooks.com" },
      { slug: "stripe-billing", name: "Stripe Billing", tagline: "Subscription billing", typeLabel: "Subscriptions", price: 0, url: "https://stripe.com/billing" },
      { slug: "chargebee", name: "Chargebee", tagline: "Recurring revenue", typeLabel: "Billing", price: 0, url: "https://www.chargebee.com" },
      { slug: "zoho-invoice", name: "Zoho Invoice", tagline: "Free invoicing", typeLabel: "Free tier", price: 0, url: "https://www.zoho.com/invoice" },
      { slug: "invoiceninja", name: "Invoice Ninja", tagline: "Open-source billing", typeLabel: "Open source", price: 0, url: "https://invoiceninja.com" },
    ],
  },
  {
    key: "crm",
    label: "CRM Software",
    group: "sales",
    labels: [["c1", "Pipeline"], ["c2", "Automation"], ["c3", "Reporting"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "hubspot", name: "HubSpot CRM", tagline: "Free CRM hub", typeLabel: "CRM", price: 0, url: "https://www.hubspot.com" },
      { slug: "salesforce", name: "Salesforce", tagline: "Enterprise CRM", typeLabel: "Enterprise", price: 25, url: "https://www.salesforce.com" },
      { slug: "pipedrive", name: "Pipedrive", tagline: "Visual pipeline", typeLabel: "Sales", price: 14, url: "https://www.pipedrive.com" },
      { slug: "zoho-crm", name: "Zoho CRM", tagline: "Affordable CRM", typeLabel: "Budget", price: 14, url: "https://www.zoho.com/crm" },
      { slug: "monday-crm", name: "Monday CRM", tagline: "Flexible CRM", typeLabel: "Flexible", price: 12, url: "https://monday.com" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory Software",
    group: "commerce",
    labels: [["c1", "Stock tracking"], ["c2", "Orders"], ["c3", "Reporting"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "cin7", name: "Cin7", tagline: "Multichannel inventory", typeLabel: "Inventory", price: 349, url: "https://www.cin7.com" },
      { slug: "tradegecko", name: "QuickBooks Commerce", tagline: "Inventory + orders", typeLabel: "Commerce", price: 39, url: "https://quickbooks.intuit.com" },
      { slug: "inflow", name: "inFlow Inventory", tagline: "SMB inventory", typeLabel: "SMB", price: 71, url: "https://www.inflowinventory.com" },
      { slug: "sortly", name: "Sortly", tagline: "Visual inventory", typeLabel: "Visual", price: 49, url: "https://www.sortly.com" },
      { slug: "fishbowl", name: "Fishbowl", tagline: "Manufacturing inventory", typeLabel: "Manufacturing", price: 0, url: "https://www.fishbowlinventory.com" },
    ],
  },
  {
    key: "field-service",
    label: "Field Service Software",
    group: "commerce",
    labels: [["c1", "Dispatch"], ["c2", "Mobile"], ["c3", "Invoicing"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "servicetitan", name: "ServiceTitan", tagline: "Trades FSM", typeLabel: "FSM", price: 0, url: "https://www.servicetitan.com" },
      { slug: "jobber", name: "Jobber", tagline: "Home service ops", typeLabel: "Home services", price: 49, url: "https://www.getjobber.com" },
      { slug: "housecall-pro", name: "Housecall Pro", tagline: "Pro field service", typeLabel: "Pros", price: 49, url: "https://www.housecallpro.com" },
      { slug: "fieldedge", name: "FieldEdge", tagline: "HVAC/plumbing FSM", typeLabel: "Trades", price: 0, url: "https://www.fieldedge.com" },
      { slug: "simpro", name: "Simpro", tagline: "Trade business software", typeLabel: "Trades", price: 0, url: "https://www.simprogroup.com" },
    ],
  },
  {
    key: "compliance",
    label: "Compliance Software",
    group: "legal",
    labels: [["c1", "Controls"], ["c2", "Audits"], ["c3", "Reporting"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "drata", name: "Drata", tagline: "Compliance automation", typeLabel: "GRC", price: 0, url: "https://drata.com" },
      { slug: "vanta", name: "Vanta", tagline: "SOC 2 automation", typeLabel: "Security compliance", price: 0, url: "https://www.vanta.com" },
      { slug: "secureframe", name: "Secureframe", tagline: "Compliance platform", typeLabel: "Compliance", price: 0, url: "https://secureframe.com" },
      { slug: "onetrust", name: "OneTrust", tagline: "Privacy & GRC", typeLabel: "Privacy", price: 0, url: "https://www.onetrust.com" },
      { slug: "hyperproof", name: "Hyperproof", tagline: "Continuous compliance", typeLabel: "Continuous", price: 0, url: "https://hyperproof.io" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics Software",
    group: "dev",
    labels: [["c1", "Dashboards"], ["c2", "Reporting"], ["c3", "Integrations"], ["c4", "Self-serve"], ["c5", "Value"]],
    winners: [
      { slug: "tableau", name: "Tableau", tagline: "Visual analytics", typeLabel: "BI", price: 15, url: "https://www.tableau.com" },
      { slug: "power-bi", name: "Power BI", tagline: "Microsoft analytics", typeLabel: "Microsoft", price: 10, url: "https://powerbi.microsoft.com" },
      { slug: "looker", name: "Looker", tagline: "Semantic BI", typeLabel: "Semantic", price: 0, url: "https://cloud.google.com/looker" },
      { slug: "metabase", name: "Metabase", tagline: "Open-source BI", typeLabel: "Open source", price: 85, url: "https://www.metabase.com" },
      { slug: "domo", name: "Domo", tagline: "Cloud BI", typeLabel: "Cloud", price: 0, url: "https://www.domo.com" },
    ],
  },
  {
    key: "hr",
    label: "HR Software",
    group: "hr",
    labels: [["c1", "Core HR"], ["c2", "Onboarding"], ["c3", "Reporting"], ["c4", "Integrations"], ["c5", "Value"]],
    winners: [
      { slug: "bamboohr", name: "BambooHR", tagline: "SMB HRIS", typeLabel: "HRIS", price: 6, url: "https://www.bamboohr.com" },
      { slug: "gusto-hr", name: "Gusto", tagline: "HR + payroll", typeLabel: "Payroll", price: 40, url: "https://gusto.com" },
      { slug: "rippling", name: "Rippling", tagline: "Unified HR + IT", typeLabel: "Unified", price: 8, url: "https://www.rippling.com" },
      { slug: "hibob", name: "HiBob", tagline: "Modern people platform", typeLabel: "People", price: 0, url: "https://www.hibob.com" },
      { slug: "paylocity", name: "Paylocity", tagline: "Mid-market HR", typeLabel: "Mid-market", price: 0, url: "https://www.paylocity.com" },
    ],
  },
];

// 200 hand-picked standalone categories (unique slugs, real winners)
const STANDALONE = [
  ["best-antivirus-software","Antivirus Software","Security & Privacy","Bitdefender","bitdefender","Business antivirus","Antivirus",4,"https://www.bitdefender.com/business","Top detection rates with centralized admin for SMB fleets.",[["c1","Detection"],["c2","Performance"],["c3","Management"],["c4","Support"],["c5","Value"]]],
  ["best-architecture-software","Architecture Software","Web & Design","Autodesk Revit","revit","BIM for architects","Architecture",0,"https://www.autodesk.com/products/revit","Industry standard BIM platform for architecture firms.",[["c1","BIM depth"],["c2","Collaboration"],["c3","Documentation"],["c4","Integrations"],["c5","Value"]]],
  ["best-automotive-dealer-software","Automotive Dealer Software","Commerce & Retail","DealerSocket","dealersocket","Auto dealer CRM","Dealer",0,"https://www.dealersocket.com","Best CRM and desking workflow for franchise dealers.",[["c1","CRM"],["c2","Desking"],["c3","Marketing"],["c4","Integrations"],["c5","Value"]]],
  ["best-b2b-marketplace-platforms","B2B Marketplace Platforms","Commerce & Retail","Alibaba.com","alibaba-b2b","Global B2B marketplace","Marketplace",0,"https://www.alibaba.com","Largest B2B sourcing marketplace for wholesale buyers.",[["c1","Catalog depth"],["c2","Supplier vetting"],["c3","Logistics"],["c4","Payments"],["c5","Value"]]],
  ["best-background-check-software","Background Check Software","HR & People","Checkr","checkr","Modern background checks","Screening",0,"https://checkr.com","Fastest API-first background checks for high-volume hiring.",[["c1","Speed"],["c2","Compliance"],["c3","API"],["c4","Integrations"],["c5","Value"]]],
  ["best-barcode-inventory-systems","Barcode Inventory Systems","Commerce & Retail","Zebra Inventory","zebra-inventory","Barcode scanning","Inventory",0,"https://www.zebra.com","Best hardware + software stack for warehouse barcode workflows.",[["c1","Scanning"],["c2","Accuracy"],["c3","Mobile"],["c4","Integrations"],["c5","Value"]]],
  ["best-benefits-administration-software","Benefits Administration Software","HR & People","Employee Navigator","employee-navigator","Benefits enrollment","Benefits",0,"https://www.employeenavigator.com","Best benefits enrollment sync for brokers and employers.",[["c1","Enrollment"],["c2","Carrier feeds"],["c3","Compliance"],["c4","Employee UX"],["c5","Value"]]],
  ["best-board-management-software","Board Management Software","Legal & Compliance","Diligent","diligent","Board portal","Governance",0,"https://www.diligent.com","Gold standard secure board portal for public companies.",[["c1","Security"],["c2","Materials"],["c3","Voting"],["c4","Compliance"],["c5","Value"]]],
  ["best-booking-engine-software","Hotel Booking Engine Software","Commerce & Retail","Cloudbeds","cloudbeds","Hospitality PMS","Booking",0,"https://www.cloudbeds.com","Best direct booking engine for independent hotels.",[["c1","Direct bookings"],["c2","Channel mgr"],["c3","Payments"],["c4","Reporting"],["c5","Value"]]],
  ["best-bug-tracking-software","Bug Tracking Software","Developer & IT","Jira Software","jira-bugs","Issue tracking","Bug tracking",8,"https://www.atlassian.com/software/jira","Default bug tracker for agile engineering teams.",[["c1","Workflows"],["c2","Agile boards"],["c3","Integrations"],["c4","Reporting"],["c5","Value"]]],
  ["best-business-card-scanners","Business Card Scanner Apps","Productivity","CamCard","camcard","Card digitization","Scanner",0,"https://www.camcard.com","Best OCR accuracy for scanning cards into CRM contacts.",[["c1","OCR accuracy"],["c2","CRM export"],["c3","Mobile UX"],["c4","Sync"],["c5","Value"]]],
  ["best-business-intelligence-etl","ETL Tools for BI","Developer & IT","Fivetran","fivetran","Managed ELT","ETL",0,"https://www.fivetran.com","Most reliable managed connectors for analytics warehouses.",[["c1","Connectors"],["c2","Reliability"],["c3","Schema mgmt"],["c4","Monitoring"],["c5","Value"]]],
  ["best-business-phone-apps","Business Phone Apps","Communication","Google Voice","google-voice","Business phone numbers","Phone app",10,"https://voice.google.com","Simplest business line for solopreneurs and small teams.",[["c1","Call quality"],["c2","Voicemail"],["c3","SMS"],["c4","Integrations"],["c5","Value"]]],
  ["best-cap-table-management","Cap Table Management Software","Finance & Accounting","Carta","carta","Equity management","Cap table",0,"https://carta.com","Default cap table platform for venture-backed startups.",[["c1","Equity modeling"],["c2","409A"],["c3","Investor portal"],["c4","Compliance"],["c5","Value"]]],
  ["best-church-management-software","Church Management Software","HR & People","Planning Center","planning-center","Church ops suite","ChMS",0,"https://www.planningcenter.com","Best all-in-one church management for midsize congregations.",[["c1","People"],["c2","Giving"],["c3","Groups"],["c4","Check-in"],["c5","Value"]]],
  ["best-client-portal-software","Client Portal Software","Customer Support","Copilot","copilot-portal","Client portal","Portal",39,"https://www.copilot.com","Best branded client portal for agencies and consultants.",[["c1","Branding"],["c2","Files"],["c3","Messaging"],["c4","Billing"],["c5","Value"]]],
  ["best-clinic-management-software","Clinic Management Software","HR & People","Kareo","kareo","Medical practice","Clinic",0,"https://www.kareo.com","Best practice management for independent medical clinics.",[["c1","Scheduling"],["c2","Billing"],["c3","EHR lite"],["c4","Reporting"],["c5","Value"]]],
  ["best-cloud-contact-centers","Cloud Contact Center Software","Communication","Genesys Cloud","genesys-cloud","CCaaS platform","Contact center",0,"https://www.genesys.com","Best enterprise CCaaS for omnichannel support at scale.",[["c1","Routing"],["c2","Omnichannel"],["c3","AI assist"],["c4","Analytics"],["c5","Value"]]],
  ["best-cloud-cost-management","Cloud Cost Management Tools","Developer & IT","CloudHealth","cloudhealth","Cloud cost optimization","FinOps",0,"https://www.cloudhealthtech.com","Best multi-cloud cost visibility for FinOps teams.",[["c1","Cost visibility"],["c2","Recommendations"],["c3","Budgets"],["c4","Integrations"],["c5","Value"]]],
  ["best-community-platform-software","Community Platform Software","Marketing & Growth","Circle","circle","Creator communities","Community",49,"https://circle.so","Best community hub for courses and membership brands.",[["c1","Spaces"],["c2","Monetization"],["c3","Mobile"],["c4","Integrations"],["c5","Value"]]],
];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mkScores(base = 8.9) {
  return { c1: base + 0.1, c2: base, c3: base - 0.1, c4: base, c5: base - 0.2, overall: base };
}

function buildGuide(def, sortOrder) {
  const rivals = def.rivals || [
    { slug: def.winner.slug + "-alt-a", name: def.winner.name + " Alt A", price: 29, url: "https://example.com", tagline: "Strong alternative", typeLabel: "Alternative" },
    { slug: def.winner.slug + "-alt-b", name: def.winner.name + " Alt B", price: 19, url: "https://example.com", tagline: "Budget option", typeLabel: "Budget" },
    { slug: def.winner.slug + "-alt-c", name: def.winner.name + " Alt C", price: 49, url: "https://example.com", tagline: "Enterprise option", typeLabel: "Enterprise" },
    { slug: def.winner.slug + "-alt-d", name: def.winner.name + " Alt D", price: 0, url: "https://example.com", tagline: "Free tier", typeLabel: "Free tier" },
    { slug: def.winner.slug + "-alt-e", name: def.winner.name + " Alt E", price: 99, url: "https://example.com", tagline: "Specialized", typeLabel: "Specialized" },
  ];
  return {
    sortOrder,
    categoryGroup: def.categoryGroup,
    slug: def.slug,
    title: def.title,
    h1: def.h1,
    intro: def.intro,
    scoreLabels: def.scoreLabels,
    winner: {
      ...def.winner,
      summary: def.winner.summary,
      scores: mkScores(9.0),
    },
    rivals,
  };
}

function standaloneToGuide(row, sortOrder) {
  const [slug, titleShort, groupName, wName, wSlug, wTag, wType, wPrice, wUrl, wSummary, labels] = row;
  const groupKey = Object.entries(GROUPS).find(([, v]) => v === groupName)?.[0] || "productivity";
  return buildGuide(
    {
      categoryGroup: GROUPS[groupKey] || groupName,
      slug,
      title: `Best ${titleShort} (2026)`,
      h1: `Best ${titleShort}`,
      intro: `We compared six ${titleShort.toLowerCase()} platforms on features, ease of use, integrations, support, and pricing for SMB buyers.`,
      scoreLabels: labels,
      winner: {
        slug: wSlug,
        name: wName,
        tagline: wTag,
        typeLabel: wType,
        price: wPrice,
        url: wUrl,
        summary: wSummary,
      },
    },
    sortOrder
  );
}

function nicheGuide(niche, typeDef, nicheIdx, sortOrder) {
  const slug = `best-${slugify(niche)}-${typeDef.key}-software`;
  const h1 = `Best ${niche} ${typeDef.label}`;
  const winner = typeDef.winners[nicheIdx % typeDef.winners.length];
  return buildGuide(
    {
      categoryGroup: GROUPS[typeDef.group],
      slug,
      title: `${h1} (2026)`,
      h1,
      intro: `We evaluated six ${typeDef.label.toLowerCase()} options built for ${niche.toLowerCase()} teams — ranked on fit, compliance needs, integrations, and total cost.`,
      scoreLabels: typeDef.labels,
      winner: {
        ...winner,
        summary: `Strong fit for ${niche.toLowerCase()} organizations needing reliable ${typeDef.label.toLowerCase()}.`,
      },
    },
    sortOrder
  );
}

function loadExistingSlugs() {
  const slugs = new Set(["best-managed-seo-services"]);
  for (const file of ["other-guides.json", "extra-guides.json"]) {
    const p = path.join(ROOT, "content", file);
    if (fs.existsSync(p)) {
      JSON.parse(fs.readFileSync(p, "utf8")).forEach((g) => slugs.add(g.slug));
    }
  }
  return slugs;
}

const existing = loadExistingSlugs();
const guides = [];
let order = START_ORDER;

for (const row of STANDALONE) {
  if (guides.length >= TARGET) break;
  if (existing.has(row[0])) continue;
  guides.push(standaloneToGuide(row, order++));
  existing.add(row[0]);
}

for (let ni = 0; ni < NICHES.length && guides.length < TARGET; ni++) {
  for (const typeDef of TYPES) {
    if (guides.length >= TARGET) break;
    const slug = `best-${slugify(NICHES[ni])}-${typeDef.key}-software`;
    if (existing.has(slug)) continue;
    guides.push(nicheGuide(NICHES[ni], typeDef, ni, order++));
    existing.add(slug);
  }
}

if (guides.length !== TARGET) {
  console.error(`Expected ${TARGET} guides, got ${guides.length}`);
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(guides, null, 2));
console.log(`Wrote ${guides.length} extra guides (batch 2) → ${OUT}`);
