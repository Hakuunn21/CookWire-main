import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          // MUI コアを分離（初期ロード最適化）
          "vendor-mui": ["@mui/material", "@emotion/react", "@emotion/styled"],
          // MUI アイコンを分離（サイズが大きい）
          "vendor-mui-icons": ["@mui/icons-material"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
