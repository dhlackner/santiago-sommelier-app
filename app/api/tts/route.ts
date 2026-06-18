import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json();

    if (!text || !voice) {
      return NextResponse.json(
        { error: 'Missing text or voice parameter' },
        { status: 400 }
      );
    }

    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!subscriptionKey || !region) {
      return NextResponse.json(
        { error: 'Azure Speech configuration missing' },
        { status: 500 }
      );
    }

    const azureUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const voiceCustomization = getVoiceCustomization(voice);
    const maxChars = 900;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars).trim() + '...' : text;
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voice}' pitch='${voiceCustomization.pitch}' rate='${voiceCustomization.rate}'>${escapeXml(truncatedText)}</voice></speak>`;

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure TTS error:', error);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

function getVoiceCustomization(voice: string): { pitch: string; rate: string } {
  const customizations: { [key: string]: { pitch: string; rate: string } } = {
    'en-US-JacobNeural': { pitch: '-15%', rate: '0.95' },
  };
  return customizations[voice] || { pitch: '0%', rate: '1.0' };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
