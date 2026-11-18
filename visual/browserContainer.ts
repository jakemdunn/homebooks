import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";

export const BROWSER_PORT = 6008;
const NAME = "homebooks-visual-browser";

/** The image's Playwright version must match the one running the tests. */
const { version } = createRequire(import.meta.url)(
  "@playwright/test/package.json",
) as { version: string };
const IMAGE = `mcr.microsoft.com/playwright:v${version}-noble`;

const docker = (...args: string[]) =>
  execFileSync("docker", args, {
    stdio: ["ignore", "pipe", "inherit"],
  }).toString();

/**
 * Whether the server in the container is listening. Docker's port forward
 * accepts connections before then, so the port alone doesn't tell.
 */
const isServerListening = () =>
  docker("logs", NAME).includes("Listening on ws://");

/**
 * Starts the browser the tests connect to, in Playwright's Linux Docker
 * image, and returns the teardown that stops it. The container serves
 * Playwright from this repo's node_modules, mounted read-only. One left
 * running by an interrupted run is replaced.
 */
export default async function startBrowserContainer() {
  try {
    execFileSync("docker", ["rm", "--force", NAME], { stdio: "ignore" });
  } catch {
    // None to replace: some Docker versions fail when it's missing.
  }
  // Pulls the image the first time, which can take a few minutes.
  docker(
    "run",
    "--detach",
    "--rm",
    "--init",
    "--user",
    "pwuser",
    "--name",
    NAME,
    "--publish",
    `127.0.0.1:${BROWSER_PORT}:${BROWSER_PORT}`,
    "--volume",
    `${process.cwd()}:/work:ro`,
    "--workdir",
    "/work",
    IMAGE,
    "node",
    "node_modules/@playwright/test/cli.js",
    "run-server",
    "--port",
    String(BROWSER_PORT),
    "--host",
    "0.0.0.0",
  );
  for (let tries = 0; !isServerListening(); tries++) {
    if (tries === 60) throw new Error(`${NAME} never started listening.`);
    await sleep(500);
  }
  return () => docker("stop", NAME);
}
