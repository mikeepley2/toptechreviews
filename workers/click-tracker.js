/**
 * Cloudflare Worker — POST /api/click (standalone deploy; Pages uses functions/api/click.js)
 */
import { handleClickRequest } from "./click-handler.mjs";

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/click") {
      return new Response("Not found", { status: 404 });
    }
    return handleClickRequest(request, env);
  },
};
