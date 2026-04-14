export interface UploadedAudioFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface SpeechTranscriptionSegment {
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
  confidence: number | null;
}

export interface SpeechTranscriptionResult {
  transcript: string;
  language: string | null;
  durationSeconds: number | null;
  segments: SpeechTranscriptionSegment[];
  provider: string;
  model: string;
}
