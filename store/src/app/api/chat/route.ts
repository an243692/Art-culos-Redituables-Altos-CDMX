import { NextResponse } from 'next/server';

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

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'config_error', details: 'GROQ_API_KEY no configurada.' },
                { status: 500 }
            );
        }

        // El catálogo viene del cliente desde Firebase
        const catalogContent: any[] = data?.catalog ?? [];

        // Construir el prompt del sistema con el catálogo completo
        let systemInstruction = `Eres un asistente de ventas de "Altos Artículos", una distribuidora mayorista y minorista de artículos en el centro de la CDMX.
Eres muy amable, persuasivo y respondes de forma concisa. Actúas como una recepcionista carismática.
Aquí está nuestro catálogo actual de productos:\n\n`;

        if (catalogContent.length > 0) {
            catalogContent.forEach((p: any) => {
                systemInstruction += `- [SKU: ${p.sku ?? 'N/A'}] ${p.name} (${p.category}): Normal $${p.precioIndividual}, Mayoreo $${p.precioMayoreo} (desde ${p.minMayoreo} pzs), Caja $${p.precioCaja} (desde ${p.minCaja} pzs). Stock: ${p.stock}\n`;
            });
        } else {
            systemInstruction += `[El catálogo está vacío. Dile al usuario que pronto habrá productos disponibles.]\n`;
        }

        systemInstruction += `
Reglas:
1. Si preguntan precios, resalta el Precio Individual y anímalos a llevar por Mayoreo o Caja mostrando cuánto ahorran.
2. Si preguntan por algo que NO está en el catálogo, di amablemente que no lo tienes.
3. Los envíos son a todo México. No prometas paqueterías ni envíos gratis.
4. Sé breve y al grano, máximo 2-3 párrafos cortos. Usa emojis para darle vida.
5. Si te hablan con groserías, responde con ironía elegante y de todas formas intenta convencerlos de comprar.
6. Sucursales: Mesones 123 o Plaza Izazaga 89, Centro CDMX.
7. Si te preguntan quién te creó: un programador muy inteligente y guapo llamado André Hernández, WhatsApp: 5648379352.`;

        // Llamada directa a la API de Groq (compatible con OpenAI)
        const groqMessages = [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: String(m.content ?? '')
            }))
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        const groqData = await groqRes.json();

        if (!groqRes.ok) {
            console.error('[Groq Error]', groqData);
            throw new Error(groqData.error?.message || 'Error al llamar a la API de Groq');
        }

        const reply = groqData.choices?.[0]?.message?.content ?? '';

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('[API /api/chat] Error:', error);
        return NextResponse.json(
            { error: 'server_error', details: error.message ?? String(error) },
            { status: 500 }
        );
    }
}
