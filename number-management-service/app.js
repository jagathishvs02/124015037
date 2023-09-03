const http = require('http');
const url = require('url');

const urls = [
  'http://20.244.56.144/numbers/primes',
  'http://20.244.56.144/numbers/fibo',
  'http://20.244.56.144/numbers/odd',
  'http://20.244.56.144/numbers/rand'
];

const serviceUrl = `http://localhost:8008/numbers?url=${urls.join('&url=')}`;

http.get(serviceUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(result);
  });
}).on('error', (error) => {
  console.error(error);
});

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { query } = parsedUrl;
  
  if (req.method === 'GET' && parsedUrl.pathname === '/numbers') {
    const urls = Array.isArray(query.url) ? query.url : [query.url];
    let mergedNumbers = [];
    let completedRequests = 0;

    const handleResponse = (numbers) => {
      mergedNumbers = mergedNumbers.concat(numbers);
      completedRequests++;

      if (completedRequests === urls.length) {
        mergedNumbers = [...new Set(mergedNumbers)].sort((a, b) => a - b);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ numbers: mergedNumbers }));
      }
    };

    urls.forEach((fetchUrl) => {
      const options = url.parse(fetchUrl);

      const request = http.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const numbers = JSON.parse(data).numbers;
            handleResponse(numbers);
          } catch (error) {
            handleResponse([]);
          }
        });
      });

      request.on('error', () => {
        handleResponse([]);
      });

      request.setTimeout(500, () => {
        request.abort();
        handleResponse([]);
      });

      request.end();
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = 8008;
server.listen(port, () => {
  console.log(`Number Management Service is listening on port ${port}`);
});

