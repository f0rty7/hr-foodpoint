import { api } from "encore.dev/api";

// Serve Angular frontend files from the local assets directory
export const app = api.static({
    expose: true,
    path: "/*path",
    dir: "./assets"
});
