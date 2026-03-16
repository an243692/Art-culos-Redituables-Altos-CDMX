    import { NextResponse } from 'next/server';
    import { GoogleGenerativeAI } from '@google/generative-ai';

    export const maxDuration = 30;

    export async function POST(req: Request) {
        try {
            const body = await req.json();
            const { messages, data } = body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return NextResponse.json(
                    { error: 'invalid_request', details: 'Se requiere un array de mensajes.' },
                    { status: 400 }
                );
            }

            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '';

            if (!apiKey || apiKey.trim() === '') {
                return NextResponse.json(
                    { error: 'missing_key', details: 'API key no configurada en el servidor.' },
                    { status: 500 }
                );
            }

            // Construir instrucción del sistema con catálogo
            const catalogContent: any[] = data?.catalog ?? [];
            let systemInstruction = `Eres un asistente de ventas de "Altos Artículos", una distribuidora mayorista y minorista de artículos.
    Eres muy amable, persuasivo y respondes de forma concisa. Actúas casi como una recepcionista carismática.
    Aquí está nuestro catálogo actual de productos:

    `;

            if (catalogContent.length > 0) {
                catalogContent.forEach((p: any) => {
                    systemInstruction += `- [SKU: ${p.sku ?? 'N/A'}] ${p.name} (${p.category}): Normal $${p.precioIndividual}, Mayoreo $${p.precioMayoreo} (desde ${p.minMayoreo}pzs), Caja $${p.precioCaja} (desde ${p.minCaja}pzs). Stock: ${p.stock}\n`;
                });
            } else {
                systemInstruction += `[Aún no hay ningún producto en el catálogo. Dile al usuario que pronto añadiremos más.]\n`;
            }

            systemInstruction += `
    Oye, eres libre de platicar y contestar preguntas sobre cualquier tema, chistes, dudas generales o incluso filosofía. NO tienes restricciones temáticas.
    
    Sin embargo, recuerda que tu papel principal es ser el asistente de "Altos Artículos", así que si el usuario pregunta algo relacionado con compras, sugerencias de productos o envíos, usa la información del catálogo proporcionado arriba para darle las respuestas correctas de nuestra tienda de forma carismática y natural, invitando a la compra por volumen (mayoreo o caja).
    
    Puedes usar emojis libremente y adaptarte al tono de conversación del usuario. Si preguntan cosas de la tienda que no están en el catálogo, simplemente di la verdad e invítalos a sugerirlo. ¡Relájate y conversa natural!
     nosotros abrimos de lunes a sabado de 9am a 6pm y los domingos de 9am a 2pm`;

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: systemInstruction,
            });

            // Convertir historial (todo excepto el último mensaje del usuario)
            const history = messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(m.content ?? '') }],
            }));

            // Último mensaje (el actual del usuario)
            const lastMessage = messages[messages.length - 1];
            const userText = String(lastMessage?.content ?? '');

            const chat = model.startChat({ history });
            const result = await chat.sendMessage(userText);
            const reply = result.response.text();

            return NextResponse.json({ reply });

        } catch (error: any) {
            console.error('[API /api/chat] Error:', error);
            return NextResponse.json(
                {
                    error: 'server_error',
                    details: error.message ?? String(error),
                },
                { status: 500 }
            );
        }
    }
