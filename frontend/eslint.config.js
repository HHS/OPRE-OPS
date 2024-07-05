import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginJestConfig from "eslint-plugin-jest";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettierConfig from "eslint-plugin-prettier";
import pluginReactHooksConfig from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginJsxConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import globals from "globals";

export default [
    { languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.browser } },
    pluginJs.configs.recommended,
    { files: ["**/*.{js,ts,jsx,tsx}"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
    ...fixupConfigRules(
        pluginReactConfig,
        pluginReactHooksConfig.configs.recommended,
        pluginJsxConfig,
        pluginJestConfig,
        pluginPrettierConfig
    ),
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
    },
    {
        plugins: {
            "jsx-a11y": pluginJsxA11y
        },
        rules: {
            ...pluginJsxA11y.configs.recommended.rules
        }
    }
];
