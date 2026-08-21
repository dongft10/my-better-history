import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // 默认 output/dist；build-extension.mjs 传 --out 时经 VITE_OUT_DIR 覆盖
    outDir: process.env.VITE_OUT_DIR || "output/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "public/index.html"),
      },
    },
  },
  publicDir: resolve(import.meta.dirname, "public"),
  define: {
    __VUE_I18N_FULL_INSTALL__: false,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
});
