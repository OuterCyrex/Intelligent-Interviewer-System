import { Module } from "@nestjs/common";
import { AudioController } from "./audio.controller";
import { AudioService } from "./audio.service";
import { OpenAiSpeechToTextProvider } from "./openai-speech-to-text.provider";

@Module({
  controllers: [AudioController],
  providers: [AudioService, OpenAiSpeechToTextProvider],
  exports: [AudioService]
})
export class AudioModule {}
