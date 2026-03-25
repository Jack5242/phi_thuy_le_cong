const http = require('http');

http.get('http://localhost:3000/api/vouchers/available?email=admin@teal.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', data));
}).on('error', err => console.error(err));
