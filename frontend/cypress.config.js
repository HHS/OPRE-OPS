import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        // Adding custom task logging, for better a11y output
        // ref: https://docs.cypress.io/api/commands/task#Usage
        // https://github.com/component-driven/cypress-axe#using-the-violationcallback-argument
        setupNodeEvents(on, config) {
            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                },
                table(message) {
                    console.table(message);

                    return null;
                }
            });
        },
        pageLoadTimeout: 180000
    },
    video: false,
    viewportHeight: 768,
    viewportWidth: 1024,
    retries: {
        // Configure retry attempts for `cypress run`
        // Default is 0
        runMode: 2,
        // Configure retry attempts for `cypress open`
        // Default is 0
        openMode: 0
    }
});
