const BASE_PATH = "./";

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        let filePath = BASE_PATH + url.pathname;

        console.log("Requested URL:", url.pathname);
        console.log("Resolved file path:", filePath);

        try {
            // Check if the requested file exists
            const fileExists = await Bun.file.exists(filePath);
            if (fileExists) {
                // If the file exists, serve it
                const file = Bun.file(filePath);
                return new Response(file);
            } else {
                // If the file doesn't exist, serve the index.html file
                const indexFilePath = BASE_PATH + "/index.html";
                const indexFile = Bun.file(indexFilePath);
                return new Response(indexFile);
            }
        } catch (error) {
            console.error("Error occurred while fetching file:", error);
            // If any error occurs, serve the index.html file
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
