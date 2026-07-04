import { handleClickRequest } from "../../workers/click-handler.mjs";

export async function onRequestPost(context) {
  return handleClickRequest(context.request, context.env);
}

export async function onRequestOptions(context) {
  return handleClickRequest(context.request, context.env);
}
