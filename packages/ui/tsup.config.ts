import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/components/**/*.tsx", "src/tokens.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["react"],
  clean: true,
  splitting: true,
  minify: true,
});
