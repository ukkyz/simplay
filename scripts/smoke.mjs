import assert from "node:assert/strict";
import { execFile, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
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
const sessionCookie = "simplayz_session";
const passphrase = () => `Smoke-only-${randomBytes(18).toString("hex")}`;
const alex = { username: "alex", password: passphrase() };
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
  const response = await fetch(`${baseURL}/login`, { signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, `Next.js could not load sign-in: ${await response.text()}`);
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
  const provision = spawnSync(process.execPath, ["--import", "tsx", "scripts/auth-alex.ts", "--stdin"], {
    input: `${alex.password}\n`, env, timeout: 20_000, encoding: "utf8",
  });
  assert.equal(provision.status, 0, `Alex provisioning failed: ${provision.stderr}`);
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

async function withPage(scenario, {
  viewport = { width: 1440, height: 900 }, account = alex, mode = "login", cookies, javaScriptEnabled = true,
} = {}) {
  const context = await browser.newContext({ baseURL, viewport, javaScriptEnabled, reducedMotion: "reduce", serviceWorkers: "block" });
  try {
    context.setDefaultTimeout(8_000);
    context.setDefaultNavigationTimeout(12_000);
    // Tiles and fonts are external; this suite must work without them.
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort(),
    );
    if (cookies) await context.addCookies(cookies);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (account) await authenticate(page, account, mode);
    await scenario(page);
    assert.deepEqual(errors, [], "Unexpected uncaught browser errors");
  } finally {
    await context.close();
  }
}

const heading = (page, name) => page.getByRole("heading", { name, exact: true });
const button = (page, name) => page.getByRole("button", { name, exact: true });
const field = (page, name) => page.getByLabel(name, { exact: true });

async function fillCredentials(page, { username, password }) {
  await field(page, "Username").fill(username);
  await field(page, "Password").fill(password);
}

async function authenticate(page, account, mode = "login") {
  await page.goto(`/${mode}`);
  await fillCredentials(page, account);
  await button(page, mode === "login" ? "Sign in" : "Create account").click();
  await page.waitForURL(new URL("/", baseURL).href);
  await button(page, `Account: ${account.username.toLowerCase()}`).waitFor();
}

test("guests cannot read world pages, metadata or JSON, or apply edits", async () => {
  for (const path of ["/", areaPath, buildingPath, aiPath, "/not-a-route"]) {
    for (const headers of [{}, { RSC: "1" }]) {
      // A Flight request without router-state headers uses an empty cache-busting key.
      const response = await fetch(baseURL + path + (headers.RSC ? "?_rsc" : ""), { redirect: "manual", headers });
      const body = await response.text();
      if (headers.RSC) {
        assert.match(response.headers.get("content-type") ?? "", /^text\/x-component/);
        assert.match(body, /NEXT_REDIRECT;[^;]+;\/login;307;/);
      } else {
        assert.equal(response.status, 307, path);
        assert.equal(response.headers.get("location"), "/login");
      }
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      assert.doesNotMatch(body, /Foundry Hall|Delfshaven Yard|Alex Rivera|systemPrompt/);
    }
  }
  for (const path of ["/login", "/register"]) {
    const response = await fetch(baseURL + path);
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(await response.text(), /Foundry Hall|Delfshaven Yard|Alex Rivera|systemPrompt/);
  }
  const url = `${baseURL}/api/world`;
  for (const headers of [{}, { Cookie: `${sessionCookie}=${"a".repeat(43)}` }]) {
    const read = await fetch(url, { headers });
    assert.equal(read.status, 401);
    assert.equal(read.headers.get("cache-control"), "no-store");
    const write = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: '{"type":"reset"}' });
    assert.equal(write.status, 401);
  }
});

test("a new member can register, sign out and sign back in using a phone and keyboard", async () => {
  const member = { username: "Harbor-Builder", password: passphrase() };
  await withPage(async (page) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").getAttribute("id"), "username");
    await page.getByRole("link", { name: "Create an account" }).press("Enter");
    await page.waitForURL("/register");
    await heading(page, "Create an account").waitFor();
    assert.equal(await field(page, "Password").getAttribute("autocomplete"), "new-password");
    await fillCredentials(page, member);
    await button(page, "Show password").press("Enter");
    assert.equal(await field(page, "Password").getAttribute("type"), "text");
    await button(page, "Hide password").press("Enter");
    await field(page, "Password").press("Enter");
    await page.waitForURL(new URL("/", baseURL).href);
    const account = button(page, "Account: harbor-builder");
    await account.press("Enter");
    await page.getByText("Shared-world member", { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await account.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator(":focus").getAttribute("aria-label"), "Account: harbor-builder");

    const [cookie] = (await page.context().cookies()).filter(({ name }) => name === sessionCookie);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "Lax");
    assert.ok(cookie.expires > Date.now() / 1000);
    assert.doesNotMatch(await page.evaluate(() => document.cookie), /simplayz_session/);
    assert.equal((await page.request.get("/api/world")).status(), 200);

    await account.press("Enter");
    await button(page, "Sign out").press("Enter");
    await page.waitForURL("/login");
    assert.equal((await page.request.get("/api/world")).status(), 401);
    assert.equal((await fetch(`${baseURL}/api/world`, { headers: { Cookie: `${cookie.name}=${cookie.value}` } })).status, 401);
    await page.goto(buildingPath);
    await page.waitForURL("/login");
    await fillCredentials(page, { username: "HARBOR-BUILDER", password: "incorrect password" });
    await button(page, "Sign in").click();
    const alert = page.getByRole("alert").filter({ hasText: "Incorrect username or password." });
    await alert.waitFor();
    assert.equal(await field(page, "Username").inputValue(), "HARBOR-BUILDER");
    await field(page, "Password").fill(member.password);
    await field(page, "Password").press("Enter");
    await page.waitForURL(new URL("/", baseURL).href);
    await account.waitFor();
    await page.goto(buildingPath);
    await heading(page, "Foundry Hall").waitFor();
  }, { account: null, viewport: { width: 390, height: 844 } });

  await withPage(async (page) => {
    await page.goto("/register");
    for (const username of ["ALex", "HARBOR-BUILDER"]) {
      await fillCredentials(page, { username, password: passphrase() });
      await button(page, "Create account").click();
      await page.getByRole("alert").filter({ hasText: "That username is unavailable." }).waitFor();
      assert.equal(await field(page, "Username").getAttribute("aria-invalid"), "true");
      assert.equal((await page.request.get("/api/world")).status(), 401);
    }
  }, { account: null });
});

test("the owner can use a native sign-in form before JavaScript loads", async () => {
  await withPage(async (page) => {
    await authenticate(page, alex);
    const response = await page.request.get("/api/world");
    assert.equal(response.status(), 200);
    assert.equal((await response.json()).player.id, "alex");
  }, { account: null, javaScriptEnabled: false });
});

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

test("a new member can add a building to the shared save and Alex can open it", async () => {
  const siteName = "SQLite Test Workshop";
  let sitePath;
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
    sitePath = new URL(page.url()).pathname;
    await page.getByRole("heading", { name: siteName, level: 1, exact: true }).waitFor();
    await page.reload();
    const plan = page.getByRole("group", { name: `${siteName} floor plan` });
    await plan.waitFor();
    assert.equal(await plan.getByRole("button").count(), 5);
  }, { account: { username: "Site-Planner", password: passphrase() }, mode: "register" });
  await withPage(async (page) => {
    await button(page, "Account: alex").click();
    await page.getByText("World owner", { exact: true }).waitFor();
    await page.goto(sitePath);
    await page.getByRole("heading", { name: siteName, level: 1 }).waitFor();
  });
});

test("room editing works without WebGL and survives a server restart and a fresh browser", async () => {
  const roomName = "Smoke Test Focus Room";
  let cookies;
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
    cookies = await page.context().cookies();
  });
  await stopServer();
  await startServer();
  await withPage(async (page) => {
    await page.goto(buildingPath);
    await roomOnPlan(page).waitFor();
  }, { account: null, cookies });
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
  }, { viewport: { width: 390, height: 844 } });
});

test("the world endpoint rejects invalid, oversized, and cross-site edits from a signed-in browser", async () => {
  await withPage(async (page) => {
    const url = "/api/world";
    const first = await page.request.get(url);
    assert.equal(first.status(), 200);
    assert.equal(first.headers()["cache-control"], "no-store");
    const initial = await first.json();
    const json = { "Content-Type": "application/json" };
    const post = (headers, data) => page.request.post(url, { headers, data });
    assert.equal((await post(json, '{"type":"reset","playerId":"other"}')).status(), 400);
    assert.equal((await post(json, "not JSON")).status(), 400);
    assert.equal((await post(json, "x".repeat(128 * 1024 + 1))).status(), 413);
    assert.equal((await post({ "Content-Type": "application/x-www-form-urlencoded" }, "type=reset")).status(), 415);
    assert.equal((await post({ ...json, "Sec-Fetch-Site": "cross-site" }, '{"type":"reset"}')).status(), 403);
    assert.deepEqual(await (await page.request.get(url)).json(), initial);
  });
});
