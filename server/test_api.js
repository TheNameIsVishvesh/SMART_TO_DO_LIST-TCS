const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/tasks',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const tasks = JSON.parse(data);
      console.log(`Successfully fetched ${tasks.length} tasks.`);
      // Check if overdue task logic works
      const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');
      console.log(`Overdue tasks count: ${overdueTasks.length}`);
    } catch (e) {
      console.log('Error parsing response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
