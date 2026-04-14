import { Body, Controller, Inject, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AudioService } from "./audio.service";
import { ProcessSpeechDto } from "./dto/process-speech.dto";
import { TranscribeAudioFileDto } from "./dto/transcribe-audio.dto";

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

  @Post("transcriptions/file")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 25 * 1024 * 1024
      }
    })
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload an audio answer and transcribe it for the interview flow" })
  @ApiBody({ type: TranscribeAudioFileDto })
  transcribeAudioFile(@UploadedFile() file: unknown, @Body() transcribeAudioFileDto: TranscribeAudioFileDto) {
    return this.audioService.transcribeAudioFile(file, transcribeAudioFileDto);
  }
}
