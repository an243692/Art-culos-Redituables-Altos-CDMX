const fs = require('fs');

async function listModels() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCfnwPXtHXUyfNjFLz2GgXmcxp7MitY4qs');
        const data = await response.json();
        fs.writeFileSync('out_models_utf8.json', JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

listModels();
