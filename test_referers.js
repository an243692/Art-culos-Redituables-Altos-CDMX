const https = require('https');

function testApiKey(key, referer) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'www.googleapis.com',
            path: `/identitytoolkit/v3/relyingparty/getProjectConfig?key=${key}`,
            method: 'GET',
            headers: {
                'Referer': referer
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ referer, status: res.statusCode }));
        });
        req.on('error', (err) => resolve({ referer, error: err.message }));
        req.end();
    });
}

async function run() {
    const key = 'AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k';
    
    const referers = [
        'http://localhost:3000/',
        'http://127.0.0.1:3000/',
        'http://localhost:5500/',
        'http://127.0.0.1:5500/',
        'https://articulos-redituables.firebaseapp.com/',
        'https://articulos-redituables.firebaseapp.com/__/auth/handler',
        'https://articulos-redituables.web.app/',
        'http://localhost'
    ];
    
    console.log('Testing referers...');
    for (const r of referers) {
        const res = await testApiKey(key, r);
        console.log(`Referer: ${res.referer} -> Status: ${res.status}`);
    }
}

run();
