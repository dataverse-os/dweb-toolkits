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
      SISMO_CREDENTIAL_CONTRACT: "0xb179298764e548877658fa9978817fc79c82f111",
    },
  },
});
