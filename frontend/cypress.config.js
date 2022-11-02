const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
    },
    video: false,
    viewportHeight: 768,
    viewportWidth: 1024,
});
