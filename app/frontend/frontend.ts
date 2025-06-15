import { api } from "encore.dev/api";

// Serve Angular frontend files from the local assets directory
// Using fallback route to serve all files in the ./assets directory under the root path.
export const app = api.static({
    expose: true,
    path: "/!path",
    dir: "./assets",
    // When a file matching the request isn't found, serve index.html instead
    // This enables Angular's client-side routing to work properly
    notFound: "./assets/index.html",
});
