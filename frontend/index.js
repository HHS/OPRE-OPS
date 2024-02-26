const BASE_PATH = "./";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath;

    // If the request is for "/", serve the "index.html" file
    if (url.pathname === "/") {
      filePath = BASE_PATH + "/index.html";
    } else if (url.pathname.startsWith("/static")) {
      // If the request starts with "/static", serve files from the "/static" directory
      filePath = BASE_PATH + url.pathname.replace(/^\/static/, "/static");
    } else {
      // For all other routes, serve files directly from the root directory
      filePath = BASE_PATH + url.pathname;
    }

    try {
      const file = await Bun.file(filePath);
      return new Response(file);
    } catch (error) {
      // If error, route to index.html
      let indexPath = BASE_PATH + "/index.html";
      const indexFile = await Bun.file(indexPath);
      return new Response(indexFile);
    }
  }
});