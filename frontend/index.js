const BASE_PATH = "./";

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        let filePath = BASE_PATH + url.pathname;

        console.log("Requested URL:", url.pathname);
        console.log("Resolved file path:", filePath);

        // If the request is for "/", serve the "index.html" file
        if (url.pathname === "/") {
            filePath = BASE_PATH + "/index.html";
        }

        try {
            const file = Bun.file(filePath);
            return new Response(file);
        } catch (error) {
            console.error("Error occurred while fetching file:", error);
            // If error, route to index.html
            let errorFilePath = BASE_PATH + "/index.html";
            const errorFile = Bun.file(errorFilePath);
            return new Response(errorFile);
        }
    },
    error(error) {
        console.error("Server error:", error);
        // If error, route to index.html
        let filePath = BASE_PATH + "/index.html";
        const file = Bun.file(filePath);
        return new Response(file);
    }
});
