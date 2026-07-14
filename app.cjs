const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const port = process.env.PORT;
const host = "0.0.0.0";
const passengerListenTarget = "passenger";
const serverEntry = path.join(__dirname, ".output-cpanel", "server", "index.mjs");
const stagingMessage = "Yoruba Heritage Park staging deployment is being prepared.";

function listen(server) {
  if (port) {
    server.listen(Number(port), host);
  } else {
    server.listen(passengerListenTarget);
  }
}

if (port) {
  process.env.NITRO_PORT = port;
  process.env.NITRO_HOST = host;
} else {
  delete process.env.NITRO_PORT;
  delete process.env.NITRO_HOST;
}

if (fs.existsSync(serverEntry)) {
  if (!port) {
    globalThis.__srvxLoader__ = ({ server }) => {
      const nodeServer = http.createServer(server.node.handler);
      server.node.server = nodeServer;
      listen(nodeServer);
    };
  }

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
