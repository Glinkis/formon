import { defineConfig } from "tsdown";

const config: unknown = defineConfig({
  entry: ["src/formon.ts"],
  format: ["cjs", "esm"],
});

export default config;
