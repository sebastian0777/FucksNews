const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const VOTES_FILE = path.join(DATA_DIR, "votes.json");

const VALID_CHOICES = new Set(["mago", "sanchez"]);

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VOTES_FILE)) {
    const initial = {
      votes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(VOTES_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(VOTES_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { votes: [], updatedAt: new Date().toISOString() };
  }
}

function writeData(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function getVoteSummary(data) {
  const summary = { mago: 0, sanchez: 0, total: 0 };
  for (const item of data.votes) {
    if (VALID_CHOICES.has(item.choice)) {
      summary[item.choice] += 1;
      summary.total += 1;
    }
  }
  return summary;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function serveStatic(req, res, pathname) {
  const decodedPath = decodeURIComponent(pathname || "/");
  const relativePath =
    decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const normalizedPath = path.normalize(relativePath);
  const fullPath = path.resolve(PUBLIC_DIR, normalizedPath);
  const allowedRoot = `${PUBLIC_DIR}${path.sep}`;

  if (fullPath !== PUBLIC_DIR && !fullPath.startsWith(allowedRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": getMimeType(fullPath) });
    res.end(content);
  });
}

function handleVote(req, res, body) {
  let payload;
  try {
    payload = JSON.parse(body || "{}");
  } catch (error) {
    sendJson(res, 400, { ok: false, error: "JSON invalido" });
    return;
  }

  const choice = String(payload.choice || "").toLowerCase().trim();
  if (!VALID_CHOICES.has(choice)) {
    sendJson(res, 400, { ok: false, error: "Opcion invalida" });
    return;
  }

  const data = readData();
  data.votes.push({
    id: crypto.randomUUID(),
    choice,
    createdAt: new Date().toISOString()
  });
  writeData(data);

  const summary = getVoteSummary(data);
  res.writeHead(201, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify({ ok: true, summary }));
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (req.method === "GET" && pathname === "/api/results") {
    const data = readData();
    sendJson(res, 200, { ok: true, summary: getVoteSummary(data) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/vote") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.socket.destroy();
    });
    req.on("end", () => handleVote(req, res, body));
    return;
  }

  if (req.method === "POST" && pathname === "/api/reset") {
    const adminToken = process.env.ADMIN_TOKEN || "";
    const provided = req.headers["x-admin-token"] || "";
    if (!adminToken || provided !== adminToken) {
      sendJson(res, 401, { ok: false, error: "No autorizado" });
      return;
    }
    writeData({ votes: [], createdAt: new Date().toISOString() });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res, pathname);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`Fucksnews votacion corriendo en http://localhost:${PORT}`);
});
