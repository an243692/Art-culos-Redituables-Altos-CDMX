const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({
    apiKey: 'AIzaSyCfnwPXtHXUyfNjFLz2GgXmcxp7MitY4qs'
});

async function testModel(modelName) {
    try {
        const { text } = await generateText({
            model: google(modelName),
            prompt: 'Hola, di hola'
        });
        console.log(`Success with ${modelName}:`, text);
    } catch (e) {
        console.log(`Failed with ${modelName}:`, e.message);
    }
}

async function runTests() {
    await testModel('gemini-2.5-flash');
    await testModel('gemini-flash-latest');
    await testModel('gemini-2.0-flash-lite');
}

runTests();
