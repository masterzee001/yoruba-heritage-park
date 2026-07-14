process.env.NITRO_PORT = process.env.PORT;
process.env.NITRO_HOST = "0.0.0.0";

if (!process.env.NITRO_PORT) {
  throw new Error("PORT is required to start the Passenger app.");
}

import("./.output-cpanel/server/index.mjs").catch((error) => {
  console.error(error);
  process.exit(1);
});
