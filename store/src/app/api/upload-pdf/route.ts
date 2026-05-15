import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { orderId, pdfBase64, idToken } = await request.json();

    if (!orderId || !pdfBase64) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const base64Data = pdfBase64.split(',')[1];
    if (!base64Data) {
      throw new Error("Invalid base64 DataURI");
    }
    
    const binaryData = Buffer.from(base64Data, 'base64');
    
    const bucket = "articulos-redituables-altos.firebasestorage.app";
    const name = encodeURIComponent(`pedidos_pdf/${orderId}.pdf`);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${name}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
    };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: binaryData
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("Firebase REST Auth fail:", errText);
      return NextResponse.json({ error: errText }, { status: response.status });
    }
    
    const data = await response.json();
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${name}?alt=media&token=${data.downloadTokens}`;

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("API Upload Error:", error);
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
