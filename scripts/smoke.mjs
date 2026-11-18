import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { preview } from "vite";

const areaPath = "/user/alex/area/delfshaven-yard";
const buildingPath = `${areaPath}/building/foundry-hall`;
const aiPath = "/user/alex/ai/management";
let server;
let browser;
let baseURL;

before(async () => {
  await access(new URL("../dist/index.html", import.meta.url)).catch((cause) => {
    throw new Error("Run npm run build before npm run smoke.", { cause });
  });
  server = await preview({
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0, strictPort: true },
  });
  baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.SMOKE_CHROMIUM_PATH || undefined,
    args: ["--disable-webgl"],
  });
});

after(async () => {
  try {
    await browser?.close();
  } finally {
    await server?.close();
  }
});

async function withPage(scenario) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  try {
    context.setDefaultTimeout(7_000);
    context.setDefaultNavigationTimeout(10_000);
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

test("opens a seeded area from the world and supports browser history and the 404 view", async () => {
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

test("loads a building deep link and keeps room editing usable without WebGL", async () => {
  await withPage(async (page) => {
    await page.goto(buildingPath);
    await heading(page, "Foundry Hall").waitFor();
    await page.getByText("WebGL is unavailable in this browser.", { exact: false }).waitFor();
    const plan = page.getByRole("group", { name: "Foundry Hall floor plan" });
    await plan.waitFor();

    await button(page, "Add room").first().click();
    const dialog = page.getByRole("dialog", { name: "Add a room" });
    const roomName = "Smoke Test Focus Room";
    const roomOnPlan = plan.getByRole("button", { name: `${roomName},`, exact: false });
    await dialog.getByLabel("Room name", { exact: true }).fill(roomName);
    await button(dialog, "Add room to plan").click();
    await roomOnPlan.waitFor();
    await page.reload();
    await roomOnPlan.waitFor();
  });
});

test("shows the mocked bot preview and persists a local prompt edit and version", async () => {
  await withPage(async (page) => {
    await page.goto(aiPath);
    const vertex = page.getByRole("article").filter({ has: heading(page, "Vertex") });
    const configure = button(vertex, "Configure");
    const savedVersion = await vertex.getByText(/^v\d+\.\d+$/).innerText();
    const [major, minor] = savedVersion.slice(1).split(".").map(Number);
    await configure.click();
    const dialog = page.getByRole("dialog");
    await button(dialog, "Structured JSON").click();
    await button(dialog, "Test prompt").click();
    await dialog.getByText("Sample output · Structured JSON", { exact: true }).waitFor();
    const sample = JSON.parse(await dialog.locator("pre").innerText());
    assert.equal(typeof sample.decision, "string");

    const field = dialog.getByLabel("System prompt", { exact: true });
    const updatedPrompt = `${await field.inputValue()}\nLocal smoke test edit.`;
    await field.fill(updatedPrompt);
    await button(dialog, "Save & deploy").click();
    const newVersion = vertex.getByText(`v${major}.${minor + 1}`, { exact: true });
    await newVersion.waitFor();
    await page.reload();
    await newVersion.waitFor();
    await configure.click();
    assert.equal(await field.inputValue(), updatedPrompt);
  });
});
