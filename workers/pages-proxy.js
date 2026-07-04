/**
 * Proxy toptechreviews.org → Cloudflare Pages origin until apex CNAME is set.
 * Optional fallback; Pages custom domain is preferred once DNS CNAME exists.
 */
const PAGES_ORIGIN = "https://toptechreviews-asz.pages.dev";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, PAGES_ORIGIN);
    const headers = new Headers(request.headers);
    headers.set("Host", new URL(PAGES_ORIGIN).host);

    const response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const out = new Response(response.body, response);
    out.headers.set("X-TopTechReviews-Proxy", "pages");
    return out;
  },
};
