import browser from "webextension-polyfill";
import { createSiteIconRecorder } from "../../util/siteIconRecorder";
import { createSiteIconReporter } from "../../util/siteIconReporter";
import { recordSiteIconMessage } from "../../util/siteIconMessages";

/** Records on this page only when the background doesn't answer. */
const recorderHere = createSiteIconRecorder(browser);

/** This page's way to hand Site Icons to the cache's writer. */
export const siteIconReporter = createSiteIconReporter({
  send: (message) => browser.runtime.sendMessage(message),
  recordHere: (message) => recordSiteIconMessage(recorderHere, message),
});
