import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettierConfig from "eslint-plugin-prettier";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginJsxConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import pluginVitest from "eslint-plugin-vitest";
import pluginCypress from "eslint-plugin-cypress";
import globals from "globals";

export default [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                cy: "readonly",
                Cypress: "readonly"
            }
        }
    },
    pluginJs.configs.recommended,
    { files: ["**/*.{js,ts,jsx,tsx}"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
    ...fixupConfigRules(pluginReactConfig),
    ...fixupConfigRules(pluginJsxConfig),
    {
        plugins: {
            "react-hooks": fixupPluginRules(pluginReactHooks)
        },
        rules: {
            ...pluginReactHooks.configs.recommended.rules
        }
    },
    // Add JSX A11y flat config
    pluginJsxA11y.flatConfigs.recommended,
    {
        ignores: [
            "**/*.md",
            "**/*.css",
            "**/*.css.map",
            "**/*.scss",
            "**/*.svg",
            "**/*.png",
            "**/*.jpg",
            "**/uswds/**",
            "**/*.d.ts"
        ]
    },
    {
        plugins: {
            "react-refresh": pluginReactRefresh,
            "eslint-plugin-prettier": pluginPrettierConfig
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    },
    {
        rules: {
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            // 1 warns instead of errors and we can ignore children props
            "react/prop-types": [1, { ignore: ["children"], skipUndeclared: true }]
        }
    },
    {
        files: ["**/*.{test,skip}.{js,ts,jsx,tsx}"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...pluginVitest.environments.env.globals
            }
        },
        plugins: {
            "testing-library": fixupPluginRules({
                rules: pluginTestingLibrary.rules
            }),
            vitest: pluginVitest
        },
        rules: {
            ...pluginTestingLibrary.configs.react.rules,
            ...pluginVitest.configs.recommended.rules,
            "no-undef": "off"
        }
    },
    {
        files: ["cypress/**/*.{js,ts,jsx,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.chai,
                // Cypress-specific globals
                cy: "readonly",
                Cypress: "readonly"
            }
        },
        plugins: {
            cypress: pluginCypress
        },
        rules: {
            ...pluginCypress.configs.recommended.rules,
            "no-undef": "warn",
            // Temporarily set these to warnings instead of errors for existing tests
            "cypress/no-unnecessary-waiting": "warn",
            "cypress/unsafe-to-chain-command": "warn"
        }
    }
];
