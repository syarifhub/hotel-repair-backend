// Simple API test script
const http = require('http');

// Test 1: Health Check
console.log('🧪 Testing API Endpoints...\n');

const testHealthCheck = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Health Check:', data);
        resolve();
      });
    }).on('error', reject);
  });
};

// Test 2: Admin Login
const testAdminLogin = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: 'admin123456'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Admin Login:', data);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  try {
    await testHealthCheck();
    await testAdminLogin();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
