import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwind from "@tailwindcss/vite"
import path from "path";

/** Miniflare tarda unos segundos en arrancar; sin warmup la 1ª petición API falla con "fetch failed". */
function warmupWorkerPlugin(): Plugin {
        return {
                name: "warmup-cloudflare-worker",
                configureServer(server) {
                        server.httpServer?.once("listening", () => {
                                const port = server.config.server.port ?? 5173;
                                const ping = () => {
                                        fetch(`http://127.0.0.1:${port}/api/ping`).catch(() => {});
                                };
                                setTimeout(ping, 1500);
                                setTimeout(ping, 4000);
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
