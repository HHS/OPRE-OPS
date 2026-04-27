/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
        "@storybook/addon-docs",
        "@storybook/addon-a11y",
        // Chromatic visual diffing — no-op locally, active in CI when CHROMATIC_PROJECT_TOKEN is set
        "@chromatic-com/storybook"
    ],
    framework: {
        name: "@storybook/react-vite",
        options: {}
    },
    // Expose USWDS compiled assets so stories can reference fonts/images by path
    staticDirs: ["../src/uswds"]
};
export default config;
