const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// 9. Usar una variable de entorno
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCfnwPXtHXUyfNjFLz2GgXmcxp7MitY4qs';
const genAI = new GoogleGenerativeAI(apiKey);

// 2. Un endpoint POST /api/chat
app.post('/api/chat', async (req, res) => {
    // 7. Manejo correcto de errores con try/catch
    try {
        // 3. Que reciba este JSON ({ messages: [...] })
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
        }

        // Extraer el último mensaje del usuario
        const lastMessage = messages[messages.length - 1].content;

        // 4. Que use el modelo: gemini-2.5-flash
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // Opcional: Instrucciones de sistema como en tu código original
            systemInstruction: {
                role: "system",
                parts: [{ text: "Eres un asistente virtual amable y conciso." }]
            }
        });

        // Construir el historial de la conversación (opcional, pero útil para contexto)
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Iniciar chat con historial y mandar el mensaje
        const chat = model.startChat({ history });

        // 5. Que genere una respuesta del modelo Gemini
        const result = await chat.sendMessage(lastMessage);
        const textResponse = result.response.text();

        // 6. Que devuelva esta respuesta: { "reply": "..." }
        res.json({
            reply: textResponse
        });

    } catch (error) {
        console.error("Express Chat API Error:", error);
        res.status(500).json({
            error: "server_error",
            details: error.message || String(error)
        });
    }
});

// Arrancar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`🤖 Modelo Gemni listo en la ruta: POST /api/chat`);
});
