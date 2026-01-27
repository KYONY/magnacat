export const GEMINI_TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

export async function synthesizeSpeech(
  text: string,
  voiceName: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  const response = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message ?? `TTS API error: ${response.status}`);
  }

  const data = await response.json();
  const audioData = data.candidates[0].content.parts[0].inlineData.data;
  const pcm = base64ToUint8Array(audioData);
  return createWavFromPcm(pcm, 24000, 1, 16);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function createWavFromPcm(
  pcm: Uint8Array,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): ArrayBuffer {
  const headerSize = 44;
  const dataSize = pcm.length;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, headerSize - 8 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size (PCM = 16)
  view.setUint16(20, 1, true); // audio format (PCM = 1)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const output = new Uint8Array(buffer);
  output.set(pcm, headerSize);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function playAudio(wavBuffer: ArrayBuffer): void {
  const audioContext = new AudioContext();
  audioContext.decodeAudioData(wavBuffer, (decodedData) => {
    const source = audioContext.createBufferSource();
    source.buffer = decodedData;
    source.connect(audioContext.destination);
    source.start(0);
  });
}
