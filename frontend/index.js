// Temporary server for Azure Dev 
const BASE_PATH = "./";

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = BASE_PATH + url.pathname;

    // If the request is for "/", serve the "index.html" file
    if (url.pathname === "/") {
      filePath = BASE_PATH + "/index.html";
    }

    const file = Bun.file(filePath);
    return new Response(file);
  },
  error() {
    return new Response(null, { status: 404 });
  },
});
