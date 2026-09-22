"use client";

import { useEffect } from "react";
import * as amplitude from "@amplitude/unified";

// Amplitude ingestion key — public by design; move to an env var when you set up environments.
const AMPLITUDE_API_KEY = "6dfcb2f414c610966e89efb28f72b2a7";

/**
 * Whether this browser session has already started the SDK.
 *
 * Module scope rather than component state: React mounts an effect twice in
 * development's strict mode, and a route change can remount the component that
 * holds it. One instance per page load is what the SDK asks for.
 */
let started = false;

/** Starts Amplitude once, whoever asks first. */
function startAmplitude() {
  if (started) {
    return;
  }
  started = true;
  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

/**
 * Starts Amplitude for the whole site.
 *
 * In the root layout, so every route is counted; it draws nothing.
 */
export function Analytics() {
  useEffect(startAmplitude, []);
  return null;
}

/**
 * The one event this site sends by hand: somebody opened the landing page.
 *
 * Everything else a visitor does — clicks, page views, form input — is
 * autocapture's, and a taxonomy is not something to invent here. It starts the
 * SDK itself rather than trusting the layout's effect to have run: a child's
 * effect fires before its parent's, and `startAmplitude` is a no-op the second
 * time.
 */
export function ViewedHomePage() {
  useEffect(() => {
    startAmplitude();
    amplitude.track("Viewed Home Page", { prompt_version: "BA400.4" }); // helps improve this setup flow — safe to remove once you've verified the event lands
  }, []);
  return null;
}
