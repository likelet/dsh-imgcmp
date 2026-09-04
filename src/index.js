// dsh-imgcmp host half — runs the Python compare bridge for two uploaded images.
//
// Exposes one exact HTTP route:
//   POST /api/dsh-imgcmp/compare  {a: <dataURL>, b: <dataURL>, threshold?}  -> result JSON
//
// The heavy lifting (SuperPoint + RANSAC geometric verification) runs in a
// Python venv inside PROJECT via the `shell` service (compare_bridge.py reads
// JSON on stdin and writes JSON on stdout).
const name = "dsh-imgcmp";
const inject = ["webServer", "shell"];

const DEFAULT_PROJECT = "/home/zhaoqi/zhaoqi/DSH/bioimg-dedup";
const MAX_BODY_BYTES = 40 * 1024 * 1024; // two ~15MB base64 data URLs
const MAX_STDOUT_BYTES = 20 * 1024 * 1024; // result JSON with 3 base64 PNGs

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(payload);
}

function readJsonBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function compare(ctx, req, res, project, timeoutMs) {
  const shell = ctx.get("shell");
  if (shell === undefined) {
    sendJson(res, 500, { error: "shell 服务不可用" });
    return;
  }
  const body = await readJsonBody(req).catch(() => null);
  const a = body !== null ? body.a : undefined;
  const b = body !== null ? body.b : undefined;
  if (typeof a !== "string" || typeof b !== "string") {
    sendJson(res, 400, { error: "需要两张图片 (a, b)" });
    return;
  }
  const threshold = body.threshold || 12;
  const spec = shell.resolve({
    command: ".venv/bin/python compare_bridge.py",
    workdir: project,
    timeoutMs: timeoutMs,
    stdoutMaxBytes: MAX_STDOUT_BYTES,
    stdin: JSON.stringify({ a, b, threshold }),
  });
  const result = await shell.run(spec);
  if (result.exitCode !== 0) {
    const stderr = result.stderr && result.stderr.text ? result.stderr.text : "";
    sendJson(res, 500, { error: "compare failed (exit " + result.exitCode + "): " + stderr });
    return;
  }
  let out;
  try {
    out = JSON.parse(result.stdout && result.stdout.text ? result.stdout.text : "");
  } catch (error) {
    sendJson(res, 500, { error: "compare 输出解析失败" });
    return;
  }
  if (out.error) {
    sendJson(res, 500, { error: out.error });
    return;
  }
  sendJson(res, 200, out);
}

function apply(ctx, config) {
  const webServer = ctx.get("webServer");
  if (webServer === undefined) return;
  const cfg = config !== null && typeof config === "object" ? config : {};
  const project = typeof cfg.project === "string" && cfg.project.length > 0 ? cfg.project : DEFAULT_PROJECT;
  const timeoutMs = typeof cfg.timeoutMs === "number" && cfg.timeoutMs > 0 ? cfg.timeoutMs : 180000;
  ctx.effect(() => webServer.register({
    kind: "exact",
    path: "/api/dsh-imgcmp/compare",
    handler: async (req, res) => {
      try {
        await compare(ctx, req, res, project, timeoutMs);
      } catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }), "dsh-imgcmp: /api/dsh-imgcmp/compare");
}

export { name, inject, apply };
