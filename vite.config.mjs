import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import {
  assertValidObservation,
  draftsDirectory,
  isFile,
  readJson,
} from "./scripts/lib/observation-content.mjs";

function isolatedDraftPreview() {
  return {
    name: "xingbuild-isolated-draft-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__xingbuild/drafts", async (request, response) => {
        const slug = decodeURIComponent((request.url || "").split("?")[0].replace(/^\/+/, ""));
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          response.statusCode = 400;
          response.end("Invalid draft slug");
          return;
        }
        const file = path.join(draftsDirectory, `${slug}.json`);
        if (!(await isFile(file))) {
          response.statusCode = 404;
          response.end("Draft not found");
          return;
        }
        try {
          const draft = assertValidObservation(await readJson(file), { expectedStatus: "draft" });
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.setHeader("Cache-Control", "no-store");
          response.end(JSON.stringify(draft));
        } catch (error) {
          response.statusCode = 422;
          response.end(error.message);
        }
      });
    },
  };
}

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [isolatedDraftPreview(), react()],
});
