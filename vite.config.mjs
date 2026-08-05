import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  assertValidObservation,
  draftsDirectory,
  isFile,
  readJson,
} from "./scripts/lib/observation-content.mjs";

const ROBOTAXI_RELEASE_ENDPOINT = "https://robotaxi.xingbuild.top/deployment-manifest.json";

function projectRobotaxiRelease(payload) {
  if (!payload || typeof payload !== "object" || !/^v\d+\.\d+\.\d+$/.test(payload.version || "") || !/^[a-f0-9]{40}$/.test(payload.commit || "")) return null;
  if (payload.production_url !== "https://robotaxi.xingbuild.top/") return null;
  return {
    version: payload.version,
    commit: payload.commit,
    production_url: payload.production_url,
    verifiedAt: new Date().toISOString(),
  };
}

function robotaxiReleaseAdapter() {
  return {
    name: "xingbuild-robotaxi-release-adapter",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__xingbuild/robotaxi-release", async (request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") return next();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        try {
          const upstream = await fetch(ROBOTAXI_RELEASE_ENDPOINT, { signal: controller.signal, cache: "no-store" });
          if (!upstream.ok) throw new Error(`upstream returned ${upstream.status}`);
          const release = projectRobotaxiRelease(await upstream.json());
          if (!release) throw new Error("upstream identity failed validation");
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
          response.end(request.method === "HEAD" ? undefined : JSON.stringify(release));
        } catch (error) {
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.setHeader("Cache-Control", "no-store");
          response.end(JSON.stringify({ error: "robotaxi-release-unavailable", detail: error.message }));
        } finally {
          clearTimeout(timeout);
        }
      });
    },
  };
}

function contentMediaPreview() {
  const contentMediaRoot = path.resolve(".content-workspace/content/media");
  return {
    name: "xingbuild-content-media-preview",
    apply: "serve",
    configureServer(server) {
      if (process.env.XINGBUILD_CONTENT_BUILD !== "1") return;
      server.middlewares.use("/media", async (request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") return next();
        const relative = decodeURIComponent((request.url || "").split("?")[0].replace(/^\/+/, ""));
        if (!relative || relative.includes("..") || relative.includes("\\")) return next();
        const file = path.resolve(contentMediaRoot, relative);
        if (!file.startsWith(`${contentMediaRoot}${path.sep}`)) return next();
        try {
          const body = await readFile(file);
          const extension = path.extname(file).toLowerCase();
          const contentType = extension === ".mp4" ? "video/mp4"
            : extension === ".png" ? "image/png"
              : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg"
                : extension === ".webp" ? "image/webp" : "application/octet-stream";
          response.statusCode = 200;
          response.setHeader("Content-Type", contentType);
          response.setHeader("Content-Length", String(body.byteLength));
          response.setHeader("Accept-Ranges", "bytes");
          response.setHeader("Cache-Control", "no-store");
          response.end(request.method === "HEAD" ? undefined : body);
        } catch {
          next();
        }
      });
    },
  };
}

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

function previewMetadata() {
  return {
    name: "xingbuild-preview-metadata",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__xingbuild/preview-meta", (_request, response) => {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify({
          cwd: process.env.XINGBUILD_PREVIEW_CWD || null,
          commit: process.env.XINGBUILD_PREVIEW_COMMIT || null,
          version: process.env.XINGBUILD_PREVIEW_VERSION || null,
          taskId: process.env.XINGBUILD_PREVIEW_TASK_ID || null,
          port: 4317,
        }));
      });
    },
  };
}

export default defineConfig({
  define: {
    __XINGBUILD_CONTENT_BUILD__: JSON.stringify(process.env.XINGBUILD_CONTENT_BUILD === "1"),
    __XINGBUILD_VISUAL_QA__: JSON.stringify(process.env.XINGBUILD_VISUAL_QA === "1"),
    __XINGBUILD_VERSION__: JSON.stringify(`v${JSON.parse(readFileSync(new URL("./package.json", import.meta.url))).version}`),
  },
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
  plugins: [isolatedDraftPreview(), previewMetadata(), robotaxiReleaseAdapter(), contentMediaPreview(), react()],
});
