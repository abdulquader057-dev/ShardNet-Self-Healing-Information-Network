import http from 'http';

http.get('http://localhost:5173/', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`BODY SIZE: ${data.length} characters`);
    console.log('Body snippet:\n', data.substring(0, 2000));
  });
}).on('error', (err) => {
  console.error('Fetch Error:', err);
});
