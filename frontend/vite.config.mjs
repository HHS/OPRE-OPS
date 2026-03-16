/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";
import { transform } from "esbuild";

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const { VITE_BACKEND_DOMAIN } = loadEnv(mode, process.cwd(), "");

    // Vitest sets mode to 'test'. We use this to gate the JSX workaround plugin
    // that is only needed under Vitest (which bundles its own Vite 7 internally).
    const isTest = mode === "test";

    return {
        build: {
            outDir: "build"
        },
        resolve: {
            tsconfigPaths: true
        },
        server: {
            host: true,
            port: 3000,
            strictPort: true,
            cors: {
                origin: function (origin, callback) {
                    // Remove JSON.stringify - it was wrapping the domain in quotes
                    if (origin === VITE_BACKEND_DOMAIN) {
                        callback(null, false); // disable CORS for backend domain
                    } else {
                        callback(null, true); // enable CORS for other origins
                    }
                }
            },
            watch: {
                usePolling: true
            },
            logger: {
                logLevel: "info",
                clearScreen: false
            }
        },
        plugins: [
            // TODO: Remove this plugin once Vitest ships with Vite 8 internally.
            //
            // WHY THIS EXISTS:
            // @vitejs/plugin-react v6 migrated JSX transforms to Vite 8's built-in Oxc
            // pipeline — it no longer uses Babel or esbuild for JSX. However, Vitest 4
            // bundles its own internal copy of Vite 7, which has no Oxc support. So when
            // tests run, plugin-react v6's Oxc config is silently ignored and no JSX
            // transform runs at all.
            //
            // NOTE: esbuild is still a real dependency of Vite 8 (not a regression).
            // We use it here as the available tool to fill the gap. This plugin will
            // become unnecessary once Vitest upgrades its internal Vite to v8+.
            //
            // - .jsx/.tsx files: Vite 7's esbuild plugin handles them but defaults to
            //   jsx:'transform' (classic runtime), so we need jsx:'automatic' here.
            // - .js files: Vite 7's esbuild plugin infers loader:'js' (not 'jsx') so JSX
            //   syntax fails; we must use loader:'jsx' explicitly.
            isTest && {
                name: "jsx-in-tests",
                enforce: "pre",
                async transform(code, id) {
                    // Strip query strings/hashes (e.g. ?v=abc, ?import) before matching
                    const cleanId = id.split("?")[0].split("#")[0];
                    if (!cleanId.match(/src\/.*\.[jt]sx?$/) || cleanId.includes("node_modules")) return null;
                    const ext = cleanId.split(".").pop();
                    const loader = ext === "js" || ext === "ts" ? `${ext}x` : ext;
                    const result = await transform(code, {
                        loader,
                        jsx: "automatic",
                        jsxImportSource: "react",
                        sourcefile: id,
                        sourcemap: true
                    });
                    return { code: result.code, map: result.map };
                }
            },
            react(),
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
            environmentOptions: {
                jsdom: {
                    url: "https://localhost:8000"
                }
            },
            setupFiles: ["./src/tests/setupTests.jsx"],
            include: ["**/*.test.{jsx,js,tsx,ts}", "**/*.spec.{jsx,js,tsx,ts}"],
            exclude: ["src/uswds/**", "node_modules/**"],
            coverage: {
                provider: "istanbul",
                reporters: ["default", "html"],
                include: ["src/**/*.{jsx,js,tsx,ts}"],
                exclude: [
                    "**/*.test.{jsx,js,tsx,ts}",
                    "**/*.spec.{jsx,js,tsx,ts}",
                    "**/tests/**",
                    "**/uswds/**",
                    "**/node_modules/**",
                    "**/dist/**",
                    "**/cypress/**"
                ]
            }
        },
        define: {
            "process.env": {}
        }
    };
});
