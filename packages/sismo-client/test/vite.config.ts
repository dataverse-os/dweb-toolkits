import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2364,
    host: "0.0.0.0",
  },
  define: {
    "process.env": {
      SISMO_APP_ID: "0x1267ea070ec44221e85667a731eee045",
      SISMO_CREDENTIAL_CONTRACT: "0x71ba07a8a93578f71e5bc8853ae88ee6de540114",
      SISMO_CREDENTIAL_FACTORY_CONTRACT: "0x146a2d25aa56d07c5bb3e7c3c0828f53c3cbc06e",
    },
  },
});
