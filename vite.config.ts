import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

const repositoryName = "like-am-player";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : `/${repositoryName}/`,
  plugins: [react(), wasm(), topLevelAwait()],
}));
