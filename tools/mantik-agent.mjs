#!/usr/bin/env node
import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 4318;
const MAX_BODY = 16 * 1024;
const MAX_OUTPUT = 96 * 1024;
const REQUEST_TIMEOUT_MS = 120_000;
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);
const EXCLUDED = new Set([".git", "node_modules", ".next", ".env", ".env.local"]);
const TASKS = {
  test: { bin: "npm", args: ["test", "--", "--run"] },
  lint: { bin: "npm", args: ["run", "lint"] },
  build: { bin: "npm", args: ["run", "build"] },
};

const ROOT = await realpath(process.cwd());
const rootInfo = await stat(path.join(ROOT, "package.json")).catch(() => null);
if (!rootInfo || !(await stat(path.join(ROOT, "src")).catch(() => null))) {
  console.error("Start the agent from the MANTIK repository root (package.json and src/ required).");
  process.exit(1);
}

const token = randomBytes(24).toString("hex");
const tokenBuffer = Buffer.from(token);
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!ALLOWED_ORIGINS.has(origin) || !["127.0.0.1:4318", "localhost:4318"].includes(host ?? "")) {
    return send(res, 403, { error: "Origin or host is not allowed." });
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Mantik-Token");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true, name: "mantik-local-agent", version: 1 });
  }
  if (req.method !== "POST" || !authorized(req.headers["x-mantik-token"])) {
    return send(res, 401, { error: "Pair with the token shown in the local agent terminal." });
  }

  try {
    const body = await readBody(req);
    if (req.url === "/git/status") {
      const [branch, status] = await Promise.all([
        run("git", ["branch", "--show-current"]),
        run("git", ["status", "--short", "--branch"]),
      ]);
      return send(res, 200, { branch: branch.stdout.trim(), status: status.stdout, exitCode: status.exitCode });
    }
    if (req.url === "/git/diff") {
      const file = safeRelativePath(body.path);
      if (file.startsWith(".git/") || file === ".git" || isExcluded(file)) {
        return send(res, 400, { error: "That path is not available." });
      }
      const result = await run("git", ["diff", "--", file]);
      return send(res, 200, { path: file, diff: result.stdout, exitCode: result.exitCode });
    }
    if (req.url === "/files/list") {
      const relative = body.path ? safeRelativePath(body.path) : "";
      const directory = await resolveInsideRoot(relative);
      const entries = await readdir(directory, { withFileTypes: true });
      const items = entries
        .filter((entry) => !EXCLUDED.has(entry.name) && !entry.name.startsWith(".env"))
        .map((entry) => ({ name: entry.name, type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other" }))
        .filter((entry) => entry.type !== "other")
        .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1);
      return send(res, 200, { path: relative, entries: items });
    }
    if (req.url === "/files/read") {
      const relative = safeRelativePath(body.path);
      if (isExcluded(relative) || relative.split("/").some((part) => part.startsWith(".env"))) {
        return send(res, 400, { error: "That file is excluded from workspace access." });
      }
      const absolute = await resolveInsideRoot(relative);
      const info = await stat(absolute);
      if (!info.isFile() || info.size > 128 * 1024) {
        return send(res, 400, { error: "Only files up to 128 KB can be read." });
      }
      const content = await readFile(absolute, "utf8");
      return send(res, 200, { path: relative, content });
    }
    if (req.url === "/tasks/run") {
      const task = TASKS[body.task];
      if (!task) return send(res, 400, { error: "Task is not allowlisted." });
      const result = await run(task.bin, task.args, REQUEST_TIMEOUT_MS);
      return send(res, 200, { task: body.task, ...result });
    }
    return send(res, 404, { error: "Unknown endpoint." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return send(res, 400, { error: message });
  }
});

function authorized(candidate) {
  if (typeof candidate !== "string") return false;
  const supplied = Buffer.from(candidate);
  return supplied.length === tokenBuffer.length && timingSafeEqual(supplied, tokenBuffer);
}

function safeRelativePath(value) {
  if (typeof value !== "string" || value.length > 512 || value.includes("\\0")) {
    throw new Error("Invalid repository path.");
  }
  const normalized = value.replaceAll("\\", "/");
  if (path.posix.isAbsolute(normalized) || normalized.split("/").some((part) => part === "..")) {
    throw new Error("Path must remain inside the repository.");
  }
  return normalized.replace(/^\.\//, "").replace(/\/$/, "");
}

function isExcluded(relative) {
  return relative.split("/").some((part) => EXCLUDED.has(part) || part.startsWith(".env"));
}

async function resolveInsideRoot(relative) {
  const candidate = path.resolve(ROOT, relative || ".");
  if (candidate !== ROOT && !candidate.startsWith(ROOT + path.sep)) {
    throw new Error("Path must remain inside the repository.");
  }
  const resolved = await realpath(candidate);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new Error("Symlinks outside the repository are not allowed.");
  }
  return resolved;
}

function run(bin, args, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: ROOT, shell: false, windowsHide: true, env: { ...process.env, CI: "1", FORCE_COLOR: "0" } });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1500).unref();
      finish(resolve, { stdout: cap(stdout), stderr: cap(stderr + "\\nTimed out."), exitCode: 124, timedOut: true });
    }, timeoutMs);
    const collect = (target, chunk) => {
      const next = target + chunk.toString("utf8");
      return next.length > MAX_OUTPUT ? next.slice(-MAX_OUTPUT) : next;
    };
    child.stdout.on("data", (chunk) => { stdout = collect(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = collect(stderr, chunk); });
    child.on("error", (error) => finish(reject, error));
    child.on("close", (code) => finish(resolve, { stdout: cap(stdout), stderr: cap(stderr), exitCode: code ?? 1, timedOut: false }));
  });
}

function cap(value) {
  return value.length > MAX_OUTPUT ? value.slice(-MAX_OUTPUT) : value;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON object required.");
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON request."));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

server.listen(PORT, HOST, () => {
  console.log("\\nMANTIK local agent is running.");
  console.log("Repository: " + ROOT);
  console.log("Listening: http://" + HOST + ":" + PORT);
  console.log("Pairing token (paste into the Terminal page; do not share it):");
  console.log(token);
  console.log("\\nAllowed tasks: npm test -- --run, npm run lint, npm run build");
  console.log("Press Ctrl+C to stop the agent.\\n");
});
server.on("error", (error) => {
  console.error("Could not start MANTIK local agent:", error.message);
  process.exitCode = 1;
});
