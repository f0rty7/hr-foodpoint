import { api, APIError } from "encore.dev/api";

// Serve static HTML files from the assets directory
export const assets = api.static({
    expose: true,
    path: "/static/*path",
    dir: "./assets"
});

// Raw endpoint to serve dynamic HTML
export const page = api.raw(
    { expose: true, path: "/page", method: "GET" },
    async (req, resp) => {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic HTML - Hem Service</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 {
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        .timestamp {
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 1.1em;
        }
        .links {
            margin-top: 30px;
        }
        .links a {
            color: #fff;
            text-decoration: none;
            margin: 0 15px;
            padding: 8px 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        .links a:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌊 Dynamic HTML</h1>
        <p>This page is generated dynamically by a raw endpoint!</p>
        
        <div class="timestamp">
            Generated at: ${new Date().toISOString()}
        </div>
        
        <p>Server time: <strong>${new Date().toLocaleString()}</strong></p>
        
        <div class="links">
            <a href="/static/index.html">Static HTML</a>
            <a href="/hem/coding">API Endpoint</a>
        </div>
    </div>
    
    <script>
        console.log('🎨 Dynamic HTML loaded at:', new Date());
    </script>
</body>
</html>`;

        resp.writeHead(200, { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache"
        });
        resp.end(html);
    }
);

// Handle /hem/:task path
export const get = api(
    {expose: true, method: 'GET', path: '/hem/:task'},
    async(params: RequestParams): Promise<Response> => {
        if(!params.task || params.task === ':task') {
            throw APIError.invalidArgument("Task is required");
        }
        return {
            message: `Hello Hem !. You are doing ${params.task}!`
        }
    }
)

interface RequestParams {
    task: string
}

interface Response {
    message: string;
}