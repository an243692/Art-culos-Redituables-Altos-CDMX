const https = require('https');

function testApiKey(key) {
    return new Promise((resolve) => {
        https.get(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${key}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ key, status: res.statusCode, data }));
        }).on('error', (err) => resolve({ key, error: err.message }));
    });
}

async function run() {
    const key1 = 'AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k';
    const key2 = 'AIzaSyC7k98HTOfqUHt0aFbGG6IVoiA5HqwCt-k';
    
    console.log('Testing keys...');
    const res1 = await testApiKey(key1);
    console.log(`Key 1 (g, o): Status ${res1.status}, ${res1.data}`);
    
    const res2 = await testApiKey(key2);
    console.log(`Key 2 (q, w): Status ${res2.status}, ${res2.data}`);
}

run();
