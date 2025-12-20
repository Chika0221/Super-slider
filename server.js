const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const SLIDES_FILE = path.join(__dirname, 'slides.md');

// Helper to determine Content-Type
const getContentType = (ext) => {
    switch (ext) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'text/javascript';
        case '.json': return 'application/json';
        case '.png': return 'image/png';
        case '.jpg': return 'image/jpeg';
        default: return 'text/plain';
    }
};

const serveStatic = (res, filepath, contentType) => {
    fs.readFile(filepath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname === '/') {
        serveStatic(res, path.join(__dirname, 'public', 'editor.html'), 'text/html');
    } else if (req.method === 'GET' && pathname === '/view') {
        serveStatic(res, path.join(__dirname, 'public', 'view.html'), 'text/html');
    } else if (req.method === 'GET' && (pathname.startsWith('/css/') || pathname.startsWith('/js/'))) {
        // Serve static assets from public folder
        const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(__dirname, 'public', safePath);

        // Ensure the path is still inside the public directory
        if (!fullPath.startsWith(path.join(__dirname, 'public'))) {
             res.writeHead(403);
             res.end('Forbidden');
             return;
        }

        const ext = path.extname(pathname);
        serveStatic(res, fullPath, getContentType(ext));
    } else if (req.method === 'GET' && pathname === '/content') {
        // Return existing slides or default content
        if (fs.existsSync(SLIDES_FILE)) {
            fs.readFile(SLIDES_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error reading file');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(data);
                }
            });
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('# Welcome\n\n- Point 1\n- Point 2');
        }
    } else if (req.method === 'POST' && pathname === '/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            // body is the raw markdown content
            fs.writeFile(SLIDES_FILE, body, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error saving file');
                } else {
                    res.writeHead(200);
                    res.end('Saved');
                }
            });
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
