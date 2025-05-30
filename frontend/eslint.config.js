import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettierConfig from "eslint-plugin-prettier";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginJsxConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import globals from "globals";

export default [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                // Add Cypress globals manually
                cy: "readonly",
                Cypress: "readonly",
                expect: "readonly",
                assert: "readonly",
                chai: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                it: "readonly",
                describe: "readonly",
                context: "readonly"
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
        plugins: {
            "testing-library": fixupPluginRules({
                rules: pluginTestingLibrary.rules
            })
        },
        rules: {
            ...pluginTestingLibrary.configs.react.rules,
            "no-undef": "off"
        }
    }
];
