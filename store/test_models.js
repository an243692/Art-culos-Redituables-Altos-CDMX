const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI('AIzaSyCfnwPXtHXUyfNjFLz2GgXmcxp7MitY4qs');
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCfnwPXtHXUyfNjFLz2GgXmcxp7MitY4qs');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

listModels();
