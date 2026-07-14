const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const port = process.env.PORT;
const host = "0.0.0.0";
const passengerListenTarget = "passenger";
const serverEntry = path.join(__dirname, ".output-cpanel", "server", "index.mjs");
const publicDir = path.join(__dirname, ".output-cpanel", "public");
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

if (port) {
  process.env.NITRO_PORT = port;
  process.env.NITRO_HOST = host;
} else {
  delete process.env.NITRO_PORT;
  delete process.env.NITRO_HOST;
}

if (fs.existsSync(serverEntry)) {
  globalThis.__srvxLoader__ = ({ server }) => {
    const nodeServer = http.createServer((request, response) => {
      if (serveStaticFile(request, response)) {
        return;
      }

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
