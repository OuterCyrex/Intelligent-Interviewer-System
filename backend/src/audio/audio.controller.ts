import { Body, Controller, Inject, Post } from "@nestjs/common";
import { AudioService } from "./audio.service";
import { ProcessSpeechDto } from "./dto/process-speech.dto";

@Controller("audio")
export class AudioController {
  constructor(@Inject(AudioService) private readonly audioService: AudioService) {}

  @Post("transcriptions")
  processTranscript(@Body() processSpeechDto: ProcessSpeechDto) {
    return this.audioService.processSpeech(processSpeechDto);
  }
}
