const BASE_PATH = "./";

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        let filePath = BASE_PATH + url.pathname;

        console.log("Requested URL:", url.pathname);
        console.log("Resolved file path:", filePath);

        try {
            // Check if the requested URL is the root
            if (url.pathname === "/") {
                // If root, serve the index.html file
                const indexFilePath = BASE_PATH + "/index.html";
                const indexFile = Bun.file(indexFilePath);
                return new Response(indexFile);
            } else {
                // Otherwise, attempt to fetch the file
                const file = Bun.file(filePath);
                // Return the file if it exists
                return new Response(file);
            }
        } catch (error) {
            console.error("Error occurred while fetching file:", error);
            // If the file doesn't exist, serve the index.html file
            const indexFilePath = BASE_PATH + "/index.html";
            const indexFile = Bun.file(indexFilePath);
            return new Response(indexFile);
        }
    },
    error(error) {
        console.error("Server error:", error);
        // Serve the index.html file in case of any server error
        const indexFilePath = BASE_PATH + "/index.html";
        const indexFile = Bun.file(indexFilePath);
        return new Response(indexFile);
    }
});
