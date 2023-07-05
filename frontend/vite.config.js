import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import jsconfigPaths from "vite-jsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), eslint(), jsconfigPaths(), svgrPlugin()],
    define: {
        "process.env": {},
    },
});
