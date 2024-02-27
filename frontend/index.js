const path = require('path');

const BASE_PATH = "./";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath;

    console.log("Requested URL:", url.pathname); // Log the requested URL path

    // If the request is for "/", serve the "index.html" file
    if (url.pathname === "/") {
      filePath = path.join(BASE_PATH, "index.html");
    } else if (url.pathname.startsWith("/static")) {
      // If the request starts with "/static", serve files from the "/static" directory
      filePath = path.join(BASE_PATH, url.pathname.replace(/^\/static/, "/static"));
    } else {
      // For all other routes, serve files directly from the root directory
      filePath = path.join(BASE_PATH, url.pathname);
    }

    console.log("Resolved file path:", filePath); // Log the resolved file path

    try {
      const file = await Bun.file(filePath);
      return new Response(file);
    } catch (error) {
      console.error("Error:", error); // Log any errors that occur

      // If error and the request is for a non-static route, serve index.html
      if (url.pathname !== "/" && !url.pathname.startsWith("/static")) {
        let indexPath = path.join(BASE_PATH, "index.html");
        const indexFile = await Bun.file(indexPath);
        return new Response(indexFile);
      }

      // Otherwise, return a 404 response
      return new Response("404 - Not Found", { status: 404 });
    }
  }
});
