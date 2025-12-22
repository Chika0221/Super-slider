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

const generateSlides = (topic) => {
    const safeTopic = topic || "My Project";
    return `# ${safeTopic}
## Hackathon Pitch

---

## 🚨 The Problem
- **Context:** What is the current situation?
- **Pain Point:** What is broken?
- **Impact:** Why does it matter?

---

## 💡 The Solution: ${safeTopic}
- **Innovation:** How we solve it.
- **Key Features:**
  - Feature 1
  - Feature 2
  - Feature 3

---

## 🛠 Tech Stack
\`\`\`javascript
const stack = {
  frontend: "Modern Web",
  backend: "Node.js",
  ai: "Generative Models"
};
\`\`\`
- Scalable Architecture
- Real-time processing

---

## 🚀 Live Demo
*Let's see it in action!*

---

## 📈 Future Roadmap
1. **Phase 1:** MVP Polish
2. **Phase 2:** User Beta
3. **Phase 3:** Monetization

---

## Thank You!
*Questions?*
`;
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
        const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(__dirname, 'public', safePath);

        if (!fullPath.startsWith(path.join(__dirname, 'public'))) {
             res.writeHead(403);
             res.end('Forbidden');
             return;
        }

        const ext = path.extname(pathname);
        serveStatic(res, fullPath, getContentType(ext));
    } else if (req.method === 'GET' && pathname === '/content') {
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
            res.end('# Welcome\n\nStart editing to create your slides!');
        }
    } else if (req.method === 'POST' && pathname === '/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
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
    } else if (req.method === 'POST' && pathname === '/generate-slides') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const markdown = generateSlides(data.topic);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(markdown);
            } catch (e) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
