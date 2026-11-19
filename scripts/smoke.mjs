import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { access, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { promisify } from "node:util";
import { chromium } from "playwright";

const areaPath = "/user/alex/area/delfshaven-yard";
const buildingPath = `${areaPath}/building/foundry-hall`;
const aiPath = "/user/alex/ai/management";
const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
let server;
let browser;
let databaseDir;
let env;
let baseURL;

async function startServer() {
  server = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", "0"], { env });
  baseURL = await new Promise((resolve, reject) => {
    let logs = "";
    const timer = setTimeout(() => reject(new Error(`Next.js did not start:\n${logs}`)), 15_000);
    server.stdout.on("data", (chunk) => {
      logs = (logs + chunk).slice(-4000);
      const url = logs.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
    server.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-4000); });
    server.once("error", (error) => { clearTimeout(timer); reject(error); });
    server.once("exit", () => { clearTimeout(timer); reject(new Error(`Next.js exited:\n${logs}`)); });
  });
  const response = await fetch(`${baseURL}/api/world`, { signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, `Next.js could not load the seeded world: ${await response.text()}`);
}

async function stopServer() {
  if (!server?.pid || server.exitCode !== null || server.signalCode !== null) return;
  const exited = once(server, "exit", { signal: AbortSignal.timeout(10_000) });
  server.kill("SIGTERM");
  try {
    await exited;
  } catch (error) {
    server.kill("SIGKILL");
    throw error;
  }
}

before(async () => {
  await access(new URL("../.next/BUILD_ID", import.meta.url)).catch((cause) => {
    throw new Error("Run npm run build before npm run smoke.", { cause });
  });
  databaseDir = await mkdtemp(join(tmpdir(), "simplayz-smoke-"));
  env = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", DATABASE_PATH: join(databaseDir, "world.sqlite") };
  await promisify(execFile)(process.execPath, ["--import", "tsx", "scripts/db.ts", "setup"], { env, timeout: 20_000 });
  await startServer();
  browser = await chromium.launch({
    executablePath: process.env.SMOKE_CHROMIUM_PATH || undefined,
    args: ["--disable-webgl"],
  });
});

after(async () => {
  try {
    await browser?.close();
  } finally {
    try {
      await stopServer();
    } finally {
      if (databaseDir) await rm(databaseDir, { recursive: true, force: true });
    }
  }
});

async function withPage(scenario, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ baseURL, viewport, reducedMotion: "reduce", serviceWorkers: "block" });
  try {
    context.setDefaultTimeout(8_000);
    context.setDefaultNavigationTimeout(12_000);
    // Tiles and fonts are external; this suite must work without them.
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await scenario(page);
    assert.deepEqual(errors, [], "Unexpected uncaught browser errors");
  } finally {
    await context.close();
  }
}

const heading = (page, name) => page.getByRole("heading", { name, exact: true });
const button = (page, name) => page.getByRole("button", { name, exact: true });

test("Next.js supports seeded navigation, history, and the 404 view", async () => {
  await withPage(async (page) => {
    const worldHeading = heading(page, "Where are we building today?");
    await page.goto("/");
    await worldHeading.waitFor();
    await button(page, "Enter area").click();
    await page.waitForURL(areaPath);
    await heading(page, "Delfshaven Yard").waitFor();
    await page.goBack();
    await worldHeading.waitFor();
    await page.goForward();
    await heading(page, "Delfshaven Yard").waitFor();
    await page.goto("/not-a-route");
    await heading(page, "This path isn't paved yet.").waitFor();
  });
});

test("adding a building saves a new deep link with five starter rooms", async () => {
  const siteName = "SQLite Test Workshop";
  await withPage(async (page) => {
    await page.goto(areaPath);
    await button(page, "Add building").first().click();
    const dialog = page.getByRole("dialog", { name: "Plan a new building" });
    await dialog.getByLabel("Building name", { exact: true }).fill(siteName);
    await dialog.getByLabel("Category", { exact: true }).selectOption("workshop");
    await button(dialog, "Add building").click();
    await button(page, `Focus ${siteName}`).waitFor();
    await button(page, "Open site").first().click();
    await page.waitForURL(`${areaPath}/building/sqlite-test-workshop-*`);
    await page.getByRole("heading", { name: siteName, level: 1, exact: true }).waitFor();
    await page.reload();
    const plan = page.getByRole("group", { name: `${siteName} floor plan` });
    await plan.waitFor();
    assert.equal(await plan.getByRole("button").count(), 5);
  });
});

test("room editing works without WebGL and survives a server restart and a fresh browser", async () => {
  const roomName = "Smoke Test Focus Room";
  const roomOnPlan = (page) => page.getByRole("group", { name: "Foundry Hall floor plan" })
    .getByRole("button", { name: `${roomName},`, exact: false });
  await withPage(async (page) => {
    await page.goto(buildingPath);
    await heading(page, "Foundry Hall").waitFor();
    await page.getByText("WebGL is unavailable in this browser.", { exact: false }).waitFor();
    await button(page, "Add room").first().click();
    const dialog = page.getByRole("dialog", { name: "Add a room" });
    const name = dialog.getByLabel("Room name", { exact: true });
    await name.fill(roomName);
    await page.route("**/api/world", (route) => route.abort());
    await button(dialog, "Add room to plan").click();
    await page.getByText("Could not confirm the save", { exact: true }).waitFor();
    assert.equal(await name.inputValue(), roomName);
    assert.equal(await roomOnPlan(page).count(), 0);
    await page.unroute("**/api/world");
    await button(dialog, "Add room to plan").click();
    await roomOnPlan(page).waitFor();
  });
  await stopServer();
  await startServer();
  await withPage(async (page) => {
    await page.goto(buildingPath);
    await roomOnPlan(page).waitFor();
  });
});

test("the mocked bot preview still works and prompt edits and controls persist", async () => {
  let updatedPrompt;
  let nextVersion;
  const vertex = (page) => page.getByRole("article").filter({ has: heading(page, "Vertex") });
  await withPage(async (page) => {
    await page.goto(aiPath);
    const savedVersion = await vertex(page).getByText(/^v\d+\.\d+$/).innerText();
    const [major, minor] = savedVersion.slice(1).split(".").map(Number);
    nextVersion = `v${major}.${minor + 1}`;
    await button(vertex(page), "Configure").click();
    const dialog = page.getByRole("dialog");
    await button(dialog, "Structured JSON").click();
    await button(dialog, "Test prompt").click();
    await dialog.getByText("Sample output · Structured JSON", { exact: true }).waitFor();
    const sample = JSON.parse(await dialog.locator("pre").innerText());
    assert.equal(typeof sample.decision, "string");

    const field = dialog.getByLabel("System prompt", { exact: true });
    updatedPrompt = `${await field.inputValue()}\nSQLite smoke test edit.`;
    await field.fill(updatedPrompt);
    await button(dialog, "Save & deploy").click();
    await vertex(page).getByText(nextVersion, { exact: true }).waitFor();
    await button(vertex(page), "Pause Vertex").click();
    await button(vertex(page), "Resume Vertex").waitFor();
    await page.getByRole("switch", { name: "Human approval" }).click();
    await page.getByRole("switch", { name: "Human approval", checked: true }).waitFor();
  });
  await withPage(async (page) => {
    await page.goto(aiPath);
    await page.getByRole("switch", { name: "Human approval", checked: true }).waitFor();
    await button(vertex(page), "Resume Vertex").waitFor();
    await vertex(page).getByText(nextVersion, { exact: true }).waitFor();
    await button(vertex(page), "Configure").click();
    assert.equal(await page.getByLabel("System prompt", { exact: true }).inputValue(), updatedPrompt);
  });
});

test("mobile navigation is keyboard operable", async () => {
  await withPage(async (page) => {
    await page.goto("/");
    const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
    await button(mobile, "AI crew").focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(aiPath);
    await heading(page, "Your management crew.").waitFor();
  }, { width: 390, height: 844 });
});

test("the world endpoint rejects malformed and cross-site commands", async () => {
  const url = `${baseURL}/api/world`;
  const initial = await (await fetch(url)).json();
  const bad = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"type":"reset","playerId":"other"}' });
  assert.equal(bad.status, 400);
  const crossSite = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" }, body: '{"type":"reset"}' });
  assert.equal(crossSite.status, 403);
  assert.deepEqual(await (await fetch(url)).json(), initial);
});
