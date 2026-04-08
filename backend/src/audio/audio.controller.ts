import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AudioService } from "./audio.service";
import { ProcessSpeechDto } from "./dto/process-speech.dto";

@ApiTags("audio")
@Controller("audio")
export class AudioController {
  constructor(@Inject(AudioService) private readonly audioService: AudioService) {}

  @Post("transcriptions")
  @ApiOperation({ summary: "Normalize a transcript and derive speech metrics" })
  @ApiBody({ type: ProcessSpeechDto })
  processTranscript(@Body() processSpeechDto: ProcessSpeechDto) {
    return this.audioService.processSpeech(processSpeechDto);
  }
}
