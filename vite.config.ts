import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Normalize to always have PluginOption[] even if a plugin returns an array
  const plugins: PluginOption[] = ([] as PluginOption[]).concat(react());

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(...([] as PluginOption[]).concat(componentTagger()));
    } catch (err) {
      console.warn("lovable-tagger not installed; skipping dev plugin.");
    }
  }

  return {
    server: {
      host: "127.0.0.1",
      port: 8080,
      strictPort: true,
    },
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
