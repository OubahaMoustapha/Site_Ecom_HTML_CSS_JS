// Minimal browser driver for the end-to-end checks: headless Chrome over the
// DevTools protocol, no extra dependencies (Node 22+ has fetch and WebSocket).
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

export const ORIGIN = process.env.E2E_ORIGIN ?? "http://localhost:5173";
export const API = process.env.E2E_API ?? "http://127.0.0.1:8000/api";
export const API_DIR = process.env.E2E_API_DIR ?? new URL("../../ecommerce-api", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@demo.test";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "password";
/** Address pattern for test accounts; "{run}" is replaced by a random id. */
export const EMAIL_PATTERN = process.env.E2E_EMAIL ?? "e2e-{run}@example.com";

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function launch({ port = 9340 } = {}) {
    const chromePath = CHROME_CANDIDATES.find((path) => existsSync(path));
    if (!chromePath) throw new Error("Chrome not found: set CHROME_PATH");

    const profile = mkdtempSync(join(tmpdir(), "durra-e2e-"));
    const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

    let ws;
    for (let i = 0; i < 60 && !ws; i++) {
        try {
            const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((target) => target.type === "page");
            if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
        } catch { await sleep(250); }
    }
    if (!ws) throw new Error("Chrome did not start");
    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

    let id = 1;
    const pending = new Map();
    const errors = [];
    ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
        if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    });

    const send = (method, params = {}) => new Promise((resolve) => { const i = id++; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
    const js = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

    await send("Page.enable");
    await send("Runtime.enable");
    await send("DOM.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    const waitFor = async (expression, timeout = 20000) => {
        const end = Date.now() + timeout;
        while (Date.now() < end) { if (await js(expression)) return true; await sleep(250); }
        return false;
    };

    const go = async (path) => {
        await send("Page.navigate", { url: ORIGIN + path });
        await sleep(400);
        await waitFor(`document.readyState === "complete" && !document.querySelector(".state--loading") && document.querySelector("#root")?.children.length > 0`, 60000);
    };

    /** Input/select/textarea found by its label text, optionally inside `scope` (a JS expression). */
    const field = (label, scope = "document") => `(() => { const l = [...${scope}.querySelectorAll(".field label")].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); return l ? document.getElementById(l.htmlFor) : null; })()`;
    const type = (label, value, scope) => js(`(() => {
        const el = ${field(label, scope)};
        if (!el) return false;
        const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(String(value))});
        el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
        return true;
    })()`);
    const select = (selector, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    const click = (selector) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
    const clickText = (selector, text, scope = "document") => js(`(() => { const el = [...${scope}.querySelectorAll(${JSON.stringify(selector)})].find((x) => x.textContent.trim().includes(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`);
    const toasts = () => js(`[...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" / ")`);

    const close = () => {
        ws.close();
        chrome.kill();
        try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold files */ }
    };

    return { send, js, waitFor, go, field, type, select, click, clickText, toasts, errors, close };
}

export function reporter(title) {
    const results = [];
    console.log(`\n== ${title}`);
    return {
        check(name, ok, detail = "") {
            results.push(Boolean(ok));
            console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok || detail === "" ? "" : `  -> ${String(detail).slice(0, 300)}`}`);
        },
        finish() {
            const passed = results.filter(Boolean).length;
            console.log(`SUMMARY ${title}: ${passed}/${results.length} passed`);
            return passed === results.length;
        },
    };
}

export async function api(method, path, token, body) {
    const isForm = body instanceof FormData;
    const response = await fetch(API + path, {
        method,
        headers: { Accept: "application/json", ...(isForm || !body ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    return { status: response.status, json: await response.json().catch(() => null) };
}

export async function adminToken() {
    const { status, json } = await api("POST", "/auth/login", null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, device_name: "e2e" });
    if (status !== 200) throw new Error(`Admin login failed (${status}): set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD`);
    return json.data.token;
}

/** Signed e-mail verification link, generated by the API itself (stands in for the inbox). */
export function verificationUrl(email) {
    const code = `$u = App\\Models\\User::where('email', '${email}')->firstOrFail(); echo Illuminate\\Support\\Facades\\URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $u->id, 'hash' => sha1($u->email)]);`
        .replaceAll("App\\Models\\User", "User").replaceAll("Illuminate\\Support\\Facades\\URL", "URL");
    return execFileSync("php", ["artisan", "tinker", `--execute=${code}`], { cwd: API_DIR, encoding: "utf8" }).trim().split("\n").pop();
}

/** A small valid PNG (64×48, solid colour), generated so the photo upload needs no fixture file. */
export function samplePng(width = 64, height = 48, rgb = [201, 164, 106]) {
    const crcTable = Array.from({ length: 256 }, (_, n) => {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        return c >>> 0;
    });
    const crc32 = (buffer) => {
        let c = 0xFFFFFFFF;
        for (const byte of buffer) c = crcTable[(c ^ byte) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    };
    const chunk = (type, data) => {
        const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
        return Buffer.concat([length, body, crc]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
    header[8] = 8; header[9] = 2; // 8-bit RGB
    const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]);
    const pixels = deflateSync(Buffer.concat(Array.from({ length: height }, () => row)));
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk("IHDR", header), chunk("IDAT", pixels), chunk("IEND", Buffer.alloc(0))]);
}
