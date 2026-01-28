import { describe, it, expect, vi, beforeEach } from "vitest";
import { synthesizeSpeech, createWavFromPcm, GEMINI_TTS_URL, playAudio } from "./gemini-tts";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function base64Encode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function ttsResponse(pcmBase64: string) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: "audio/L16;rate=24000", data: pcmBase64 } }],
            },
          },
        ],
      }),
  };
}

describe("gemini-tts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("synthesizeSpeech", () => {
    it("returns ArrayBuffer with WAV data", async () => {
      const pcmData = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
      mockFetch.mockResolvedValueOnce(ttsResponse(base64Encode(pcmData)));

      const result = await synthesizeSpeech("hello", "Kore", "test-key");
      expect(result).toBeInstanceOf(ArrayBuffer);
      // WAV header is 44 bytes + PCM data
      expect(result.byteLength).toBe(44 + pcmData.length);
    });

    it("sends correct request body with audio modality", async () => {
      const pcmData = new Uint8Array([0, 1]);
      mockFetch.mockResolvedValueOnce(ttsResponse(base64Encode(pcmData)));

      await synthesizeSpeech("hello", "Kore", "my-key");

      expect(mockFetch).toHaveBeenCalledWith(
        `${GEMINI_TTS_URL}?key=my-key`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
      expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        "Kore"
      );
    });

    it("uses gemini-2.5-flash-preview-tts model", () => {
      expect(GEMINI_TTS_URL).toContain("gemini-2.5-flash-preview-tts");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: "Server error" } }),
      });

      await expect(synthesizeSpeech("hello", "Kore", "key")).rejects.toThrow();
    });
  });

  describe("createWavFromPcm", () => {
    it("creates valid WAV header (44 bytes RIFF/WAVE/fmt/data)", () => {
      const pcm = new Uint8Array([10, 20, 30, 40]);
      const wav = createWavFromPcm(pcm, 24000, 1, 16);
      const view = new DataView(wav);

      // RIFF header
      expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe("RIFF");
      // File size - 8
      expect(view.getUint32(4, true)).toBe(wav.byteLength - 8);
      // WAVE
      expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe("WAVE");
      // fmt
      expect(String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))).toBe("fmt ");
      // data chunk
      expect(String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39))).toBe("data");
      // data size
      expect(view.getUint32(40, true)).toBe(pcm.length);
    });

    it("total size = 44 header + pcm data", () => {
      const pcm = new Uint8Array(100);
      const wav = createWavFromPcm(pcm, 24000, 1, 16);
      expect(wav.byteLength).toBe(144);
    });
  });

  describe("playAudio", () => {
    it("returns a stop function", () => {
      const mockSource = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      const mockClose = vi.fn();
      const mockDecodeAudioData = vi.fn((_buf: ArrayBuffer, cb: (data: AudioBuffer) => void) => {
        cb({ length: 1 } as AudioBuffer);
      });
      const mockCreateBufferSource = vi.fn(() => mockSource);

      // Use a function constructor so `new AudioContext()` works
      vi.stubGlobal("AudioContext", function (this: Record<string, unknown>) {
        this.decodeAudioData = mockDecodeAudioData;
        this.createBufferSource = mockCreateBufferSource;
        this.destination = {};
        this.close = mockClose;
      });

      const pcm = new Uint8Array([0, 1, 2, 3]);
      const wav = createWavFromPcm(pcm, 24000, 1, 16);
      const stop = playAudio(wav);

      expect(typeof stop).toBe("function");
      expect(mockSource.start).toHaveBeenCalledWith(0);

      stop();
      expect(mockSource.stop).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
