import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 大きなサイズのライブラリ(MSAL、React Router)を個別チャンクに分割
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "msal",
              test: /node_modules\/@azure\/msal-(browser|react)\//,
            },
            {
              name: "router",
              test: /node_modules\/react-router\//,
            },
          ],
        },
      },
    },
  },
}));
