import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwind from "@tailwindcss/vite"
import path from "path";

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
