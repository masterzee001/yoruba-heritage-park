const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const port = process.env.PORT;
const host = "0.0.0.0";
const passengerListenTarget = "passenger";
const serverEntry = path.join(__dirname, ".output-cpanel", "server", "index.mjs");
const publicDir = path.join(__dirname, ".output-cpanel", "public");
const runtimeEnvFiles = [path.join(__dirname, ".env"), path.join(__dirname, ".cpanel-runtime.env")];
const stagingMessage = "Yoruba Heritage Park staging deployment is being prepared.";
const staticPrefixes = ["/assets/", "/brand/", "/reference/"];
const mimeTypes = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function loadRuntimeEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    const normalizedLine = index === 0 ? line.replace(/^\uFEFF/, "") : line;
    const trimmed = normalizedLine.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

function listen(server) {
  if (port) {
    server.listen(Number(port), host);
  } else {
    server.listen(passengerListenTarget);
  }
}

function sendStaticError(response, statusCode) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=UTF-8",
  });
  response.end();
}

function getStaticFilePath(requestUrl) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  if (!staticPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const relativePath = path.normalize(pathname.slice(1));
  const filePath = path.join(publicDir, relativePath);
  const relativeToPublic = path.relative(publicDir, filePath);
  const topLevelDirectory = relativePath.split(path.sep)[0];

  if (
    relativeToPublic.startsWith("..") ||
    path.isAbsolute(relativeToPublic) ||
    !["assets", "brand", "reference"].includes(topLevelDirectory)
  ) {
    return false;
  }

  return filePath;
}

function serveStaticFile(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  const filePath = getStaticFilePath(request.url || "/");

  if (filePath === null) {
    return false;
  }

  if (filePath === false) {
    sendStaticError(response, 400);
    return true;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendStaticError(response, 404);
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": stats.size,
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(filePath)
      .on("error", () => {
        if (!response.headersSent) {
          sendStaticError(response, 500);
        } else {
          response.destroy();
        }
      })
      .pipe(response);
  });

  return true;
}

function restoreRewrittenRoute(request) {
  const requestUrl = request.url || "/";
  const parsedUrl = new URL(requestUrl, "http://localhost");
  const rewrittenRoute = parsedUrl.searchParams.get("__yhp_route");

  if (!rewrittenRoute || !rewrittenRoute.startsWith("/")) {
    return;
  }

  parsedUrl.searchParams.delete("__yhp_route");
  request.url = `${rewrittenRoute}${parsedUrl.search}`;
}

if (port) {
  process.env.NITRO_PORT = port;
  process.env.NITRO_HOST = host;
} else {
  delete process.env.NITRO_PORT;
  delete process.env.NITRO_HOST;
}

for (const runtimeEnvFile of runtimeEnvFiles) {
  loadRuntimeEnv(runtimeEnvFile);
}

if (fs.existsSync(serverEntry)) {
  globalThis.__srvxLoader__ = ({ server }) => {
    const nodeServer = http.createServer((request, response) => {
      if (serveStaticFile(request, response)) {
        return;
      }

      restoreRewrittenRoute(request);
      server.node.handler(request, response);
    });

    server.node.server = nodeServer;
    listen(nodeServer);
  };

  import(pathToFileURL(serverEntry).href).catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  const server = http
    .createServer((_request, response) => {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=UTF-8",
      });
      response.end(stagingMessage);
    })
    .on("error", (error) => {
      console.error(error);
      process.exit(1);
    });

  listen(server);
}
