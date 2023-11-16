import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteJsconfigPaths from "vite-jsconfig-paths";
import svgr from "vite-plugin-svgr";
// import eslint from "vite-plugin-eslint";
import fs from "fs/promises";
// import macrosPlugin from "vite-plugin-babel-macros";

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
    server: {
        port: 3000,
        cors: {
            origin: function (origin, callback) {
                if (origin === "http://localhost:8080") {
                    callback(null, false); // disable CORS for localhost:8080
                } else {
                    callback(null, true); // enable CORS for other origins
                }
            }
        }
    },
    plugins: [
        react({
            babel: {
                plugins: ["babel-plugin-macros"]
            }
        }),
        viteJsconfigPaths(),
        // eslint(),
        // macrosPlugin(),
        svgr({
            include: "**/*.svg?react"
        })
    ],
    define: {
        "process.env": {}
    },
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.jsx?$/,
        exclude: []
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                {
                    name: "load-js-files-as-jsx",
                    setup(build) {
                        build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
                            loader: "jsx",
                            contents: await fs.readFile(args.path, "utf8")
                        }));
                    }
                }
            ]
        }
    }
});
