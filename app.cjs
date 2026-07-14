const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const port = process.env.PORT;
const host = "0.0.0.0";
const serverEntry = path.join(__dirname, ".output-cpanel", "server", "index.mjs");
const stagingMessage = "Yoruba Heritage Park staging deployment is being prepared.";

if (!port) {
  throw new Error("PORT is required to start the Passenger app.");
}

process.env.NITRO_PORT = port;
process.env.NITRO_HOST = host;

if (fs.existsSync(serverEntry)) {
  import(pathToFileURL(serverEntry).href).catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  http
    .createServer((_request, response) => {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=UTF-8",
      });
      response.end(stagingMessage);
    })
    .listen(Number(port), host);
}
