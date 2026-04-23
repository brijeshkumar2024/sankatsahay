import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/shelters/,
            handler: "CacheFirst",
            options: {
              cacheName: "shelters-cache",
              expiration: { maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\/api\/family/,
            handler: "NetworkFirst"
          },
          {
            urlPattern: /\/models\//,
            handler: "CacheFirst",
            options: {
              cacheName: "ml-models",
              expiration: { maxAgeSeconds: 604800 }
            }
          }
        ]
      },
      manifest: {
        name: "SankatSahay",
        short_name: "SankatSahay",
        theme_color: "#0A0E1A",
        background_color: "#0A0E1A",
        display: "standalone",
        icons: [{ src: "/vite.svg", sizes: "192x192", type: "image/svg+xml" }]
      }
    })
  ],
  server: {
    port: 5173
  }
});
