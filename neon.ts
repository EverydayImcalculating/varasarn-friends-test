import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  dataApi: {
    settings: {
      dbSchemas: ["api"],
      dbMaxRows: 100,
    },
  },
  preview: {
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
