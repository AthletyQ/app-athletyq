import { SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { pollyClient } from "@/lib/aws/pollyClient";

export async function POST(req: Request) {
    try {
        const { text } = await req.json() as { text: string };

        if (!text?.trim()) {
            return new Response("Missing text", { status: 400 });
        }

        const command = new SynthesizeSpeechCommand({
            Text: text,
            OutputFormat: "mp3",
            VoiceId: "Matthew",   
            Engine: "neural",
            LanguageCode: "en-US",
        });

        const response = await pollyClient.send(command);

        if (!response.AudioStream) {
            return new Response("No audio returned from Polly", { status: 502 });
        }

        
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        console.log(`[TTS] Synthesized ${audioBuffer.byteLength} bytes for: "${text.slice(0, 60)}..."`);

        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": String(audioBuffer.byteLength),
                
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[TTS] Error:", error);
        return new Response("TTS failed", { status: 500 });
    }
}
