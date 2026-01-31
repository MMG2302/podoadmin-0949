import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwind from "@tailwindcss/vite"
import path from "path";

export default defineConfig({
        plugins: [react(), cloudflare(), tailwind()],
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
        }
});
