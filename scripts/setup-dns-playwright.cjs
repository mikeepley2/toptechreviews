const { chromium } = require("playwright");
const path = require("path");

const ZONE = "15f6a24dcd19a1fc7dbe338ead207dac";
const ACCOUNT = "ce5386b2fc97a5d44d4a1a7446f8ac2c";
const TARGET = "toptechreviews-asz.pages.dev";
const CHROME = path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data");

async function addRecord(page, fieldName) {
  await page.goto(`https://dash.cloudflare.com/${ACCOUNT}/${ZONE}/dns/records`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  if (page.url().includes("/login")) {
    throw new Error("Not logged in to Cloudflare in Chrome — open Chrome, sign in, rerun script");
  }

  await page.getByRole("button", { name: /add record/i }).click({ timeout: 30000 });
  await page.locator('[data-testid="dns-record-type-select"], select').first().selectOption("CNAME");
  await page.locator('[data-testid="dns-record-name"], input[name="name"]').fill(fieldName);
  await page.locator('[data-testid="dns-record-content"], input[name="content"]').fill(TARGET);
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.waitForTimeout(2500);
  console.log("Saved CNAME", fieldName || "@");
}

(async () => {
  const context = await chromium.launchPersistentContext(CHROME, {
    channel: "chrome",
    headless: false,
    args: ["--profile-directory=Default"],
  });
  const page = context.pages()[0] || (await context.newPage());
  try {
    await addRecord(page, "@");
    await addRecord(page, "www");
    console.log("DNS records created for toptechreviews.org");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await context.close();
  }
})();
