import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwind from "@tailwindcss/vite"
import fs from "fs";
import path from "path";
import { buildHtmlCspMetaContent } from "./scripts/html-csp";
import {
        DEFAULT_LANG,
        buildJsonLd,
        buildLlmsTxt,
        buildPrerenderedLanding,
        buildRobotsTxt,
        buildSeoHeadTags,
        buildSitemapXml,
        getSeoTitle,
} from "./scripts/seo";

/** Inyecta CSP en index.html (Turnstile y otros proveedores hosted). */
function htmlCspPlugin(): Plugin {
        return {
                name: "html-csp-turnstile",
                transformIndexHtml(html) {
                        const csp = buildHtmlCspMetaContent();
                        return html.replace(
                                /<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/>/,
                                `<meta http-equiv="Content-Security-Policy" content="${csp}" />`
                        );
                },
        };
}

/**
 * SEO: `<head>` completo, JSON-LD, landing pre-renderizada y robots/sitemap/llms.
 *
 * Solo en build. En dev estorbaría (el HTML estático parpadea antes de que monte React)
 * y no aporta nada: lo que importa es lo que se sirve en producción.
 */
function seoPlugin(): Plugin {
        return {
                name: "podoraa-seo",
                apply: "build",

                transformIndexHtml(html) {
                        return html
                                .replace('<html lang="en">', `<html lang="${DEFAULT_LANG}">`)
                                .replace(
                                        /<title>[^<]*<\/title>/,
                                        `<title>${getSeoTitle()}</title>\n\t\t${buildSeoHeadTags()}\n\t\t${buildJsonLd()}`
                                )
                                .replace(
                                        /<div id="root">[\s\S]*?<\/div>\s*<\/div>/,
                                        `<div id="root">${buildPrerenderedLanding()}</div>`
                                );
                },

                /**
                 * El build de Cloudflare emite cliente y worker por separado; estos archivos solo
                 * tienen sentido en dist/client, que es lo que sirve el asset handler.
                 */
                writeBundle(options) {
                        const dir = options.dir;
                        if (!dir || path.basename(dir) !== "client") return;

                        const files: Record<string, string> = {
                                "robots.txt": buildRobotsTxt(),
                                "sitemap.xml": buildSitemapXml(),
                                "llms.txt": buildLlmsTxt(),
                        };

                        for (const [name, contents] of Object.entries(files)) {
                                fs.writeFileSync(path.join(dir, name), contents, "utf8");
                        }
                        console.log(`SEO: ${Object.keys(files).join(", ")} escritos en ${dir}`);
                },
        };
}

/** Miniflare tarda unos segundos en arrancar; sin warmup la 1ª petición API falla con HTML/500. */
function scheduleWorkerWarmup(server: ViteDevServer, delaysMs: number[]) {
        const port = server.config.server.port ?? 5173;
        for (const delay of delaysMs) {
                setTimeout(() => {
                        fetch(`http://127.0.0.1:${port}/api/ping`, {
                                headers: { Accept: "application/json" },
                        }).catch(() => {});
                }, delay);
        }
}

function warmupWorkerPlugin(): Plugin {
        return {
                name: "warmup-cloudflare-worker",
                configureServer(server) {
                        server.httpServer?.once("listening", () => {
                                scheduleWorkerWarmup(server, [1500, 4000, 8000, 12000]);
                        });

                        // Tras cambios en backend, el worker se recarga y puede colgarse unos segundos.
                        let reloadTimer: ReturnType<typeof setTimeout> | null = null;
                        server.watcher.on("change", (file) => {
                                const normalized = file.replace(/\\/g, "/");
                                if (!normalized.includes("/src/api/") && !normalized.includes("/src/worker.ts")) {
                                        return;
                                }
                                if (reloadTimer) clearTimeout(reloadTimer);
                                reloadTimer = setTimeout(() => {
                                        scheduleWorkerWarmup(server, [2000, 5000, 9000]);
                                }, 400);
                        });
                },
        };
}

export default defineConfig({
        plugins: [
                react(),
                cloudflare({ inspectorPort: false }),
                tailwind(),
                htmlCspPlugin(),
                seoPlugin(),
                warmupWorkerPlugin(),
        ],
        resolve: {
                alias: {
                        "@": path.resolve(__dirname, "./src/web"),
                },
        },
        build: {
                target: ["es2015", "safari14"],
        },
        server: {
                allowedHosts: true,
                hmr: {
                        overlay: false, // Evita que el overlay bloquee la UI cuando hay errores del Worker
                },
        },
});
