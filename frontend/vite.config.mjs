/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import viteJsconfigPaths from "vite-jsconfig-paths";
import svgr from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const { VITE_BACKEND_DOMAIN } = loadEnv(mode, process.cwd(), "");

    return {
        build: {
            outDir: "build"
        },
        css: {
            preprocessorOptions: {
                // file: "./sass/uswds/styles.scss", // default: "styles.css
                scss: {
                    includePaths: ["./node_modules/@uswds", "./node_modules/@uswds/uswds/packages"]
                }
            }
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
            setupFiles: "./src/tests/setupTests.js",
            coverage: {
                provider: "istanbul",
                reporters: ["default", "html"],
                exclude: [
                    "**/uswds/**",
                    "**/node_modules/**",
                    "**/dist/**",
                    "**/cypress/**",
                    "**/.{idea,git,cache,output,temp}/**",
                    "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*"
                ]
            }
        },
        define: {
            "process.env": {}
        },
        esbuild: {
            loader: "jsx",
            include: /src\/.*\.jsx?$/,
            exclude: []
        }
    };
});
