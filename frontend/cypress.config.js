const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        setupNodeEvents(on, config) {
            on("task", {
                printTableToConsole(data) {
                    console.table(data);
                    return null;
                },
            });
        },
    },
    video: false,
});
