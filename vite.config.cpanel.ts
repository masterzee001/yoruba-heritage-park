import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node_server",
    output: {
      dir: ".output-cpanel",
      publicDir: ".output-cpanel/public",
      serverDir: ".output-cpanel/server",
    },
  },
});
