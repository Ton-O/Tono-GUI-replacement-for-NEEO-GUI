const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // 1. Haal de URL op en strip eventuele query parameters (?v=123) veilig
  let safeUrl = req.url ? req.url.split('?')[0] : '/';

  // 2. CORRECTIE: Als de URL leeg is of puur een slash is, maak er /index.html van
  if (!safeUrl || safeUrl === '/') {
    safeUrl = '/index.html';
  } else if (safeUrl.endsWith('/')) {
    // Als het eindigt op een slash (bijv. /map/), plak er index.html achter
    safeUrl += 'index.html';
  } else if (!path.extname(safeUrl)) {
    // Als er geen bestandsextensie is (bijv. /contact), stuur ook door naar index.html
    safeUrl += '/index.html';
  }

  const filePath = '.' + safeUrl;
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Bestand niet gevonden');
      } else {
        res.writeHead(500);
        res.end(`Server Fout: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
