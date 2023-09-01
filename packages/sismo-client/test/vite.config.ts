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
      SISMO_CREDENTIAL_CONTRACT: "0xb179298764e548877658fa9978817fc79c82f111",
    },
  },
});
