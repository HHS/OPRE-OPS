/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import viteJsconfigPaths from "vite-jsconfig-paths";
import svgr from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";
import fs from "fs/promises";

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const { VITE_BACKEND_DOMAIN } = loadEnv(mode, process.cwd(), "");

    return {
        build: {
            outDir: "build"
        },
        server: {
            host: true,
            port: 3000,
            strictPort: true,
            cors: {
                origin: function (origin, callback) {
                    if (origin === JSON.stringify(VITE_BACKEND_DOMAIN)) {
                        callback(null, false); // disable CORS for backend domain
                    } else {
                        callback(null, true); // enable CORS for other origins
                    }
                }
            },
            watch: {
                usePolling: true
            }
        },
        plugins: [
            react({
                babel: {
                    plugins: ["babel-plugin-macros"]
                }
            }),
            viteJsconfigPaths(),
            svgr({
                include: "**/*.svg?react"
            }),
            {
                // default settings on build (i.e. fail on error)
                ...eslint(),
                apply: "build"
            },
            {
                // do not fail on serve (i.e. local development)
                ...eslint({
                    failOnWarning: false,
                    failOnError: false
                }),
                apply: "serve",
                enforce: "post"
            }
        ],
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: "./src/setupTests.js",
            coverage: {}
        },
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
    };
});
