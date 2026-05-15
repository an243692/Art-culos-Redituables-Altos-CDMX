import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;

        if (!file || !path) {
            return NextResponse.json({ error: 'No file or path provided' }, { status: 400 });
        }

        // Convert the File out of the FormData into a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const storageRef = ref(storage, path);
        // Upload the bytes to Firebase Storage directly from the Node backend
        // This completely ignores the Firebase Storage CORS policy restriction!
        await uploadBytes(storageRef, uint8Array, {
            contentType: file.type
        });

        // Retrieve the public URL
        const downloadUrl = await getDownloadURL(storageRef);

        return NextResponse.json({ url: downloadUrl }, { status: 200 });

    } catch (error: any) {
        console.error('Error uploading file to Firebase from backend:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
