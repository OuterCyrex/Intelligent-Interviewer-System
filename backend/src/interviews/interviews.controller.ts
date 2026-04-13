import { Body, Controller, Get, Inject, Param, Post, Query, Res } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateInterviewDto } from "./dto/create-interview.dto";
import { SubmitInterviewAnswerDto } from "./dto/submit-answer.dto";
import { InterviewsService } from "./interviews.service";

@ApiTags("interviews")
@Controller("interviews")
export class InterviewsController {
  constructor(@Inject(InterviewsService) private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: "Start a new interview session" })
  @ApiBody({ type: CreateInterviewDto })
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewsService.create(createInterviewDto);
  }

  @Get()
  @ApiOperation({ summary: "List interview sessions" })
  @ApiQuery({ name: "candidateName", required: false })
  @ApiQuery({ name: "positionId", required: false })
  @ApiQuery({ name: "status", required: false })
  findAll(
    @Query("candidateName") candidateName?: string,
    @Query("positionId") positionId?: string,
    @Query("status") status?: string
  ) {
    return this.interviewsService.findAll({
      candidateName,
      positionId,
      status
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an interview session by id" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  findOne(@Param("id") id: string) {
    return this.interviewsService.findOne(id);
  }

  @Get(":id/active-turn")
  @ApiOperation({ summary: "Get the current unanswered turn for an interview" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  findActiveTurn(@Param("id") id: string) {
    return this.interviewsService.findActiveTurn(id);
  }

  @Post(":id/answers")
  @ApiOperation({ summary: "Submit an answer for the current interview turn" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  @ApiBody({ type: SubmitInterviewAnswerDto })
  submitAnswer(@Param("id") id: string, @Body() submitAnswerDto: SubmitInterviewAnswerDto) {
    return this.interviewsService.submitAnswer(id, submitAnswerDto);
  }

  @Post(":id/answers/stream")
  @ApiOperation({ summary: "Submit an answer and stream progress/result via SSE" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  @ApiBody({ type: SubmitInterviewAnswerDto })
  async submitAnswerStream(
    @Param("id") id: string,
    @Body() submitAnswerDto: SubmitInterviewAnswerDto,
    @Res() res: any
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("status", { phase: "received", message: "已接收答案，开始评估..." });

    try {
      send("status", { phase: "evaluating", message: "AI评估中..." });

      let llmJsonBuffer = "";
      let streamedEvaluation = "";
      let streamedFollowUp = "";
      let answerTurnId = submitAnswerDto.turnId || "";
      let evaluationStarted = false;
      let nextPromptStarted = false;

      const result = await this.interviewsService.submitAnswer(id, submitAnswerDto, {
        onLlmTextDelta: (delta) => {
          llmJsonBuffer += delta;
          if (!answerTurnId) {
            return;
          }

          const evaluationNow = this.tryExtractJsonStringField(llmJsonBuffer, "evaluationSummary");
          if (evaluationNow && evaluationNow.length > streamedEvaluation.length) {
            if (!evaluationStarted) {
              send("evaluation_start", { turnId: answerTurnId });
              evaluationStarted = true;
            }
            const text = evaluationNow.slice(streamedEvaluation.length);
            streamedEvaluation = evaluationNow;
            send("evaluation_delta", { turnId: answerTurnId, text });
          }

          const followUpNow = this.tryExtractJsonStringField(llmJsonBuffer, "followUpPrompt");
          if (followUpNow && followUpNow.length > streamedFollowUp.length) {
            if (!nextPromptStarted) {
              send("next_prompt_start", { turnId: answerTurnId });
              nextPromptStarted = true;
            }
            const text = followUpNow.slice(streamedFollowUp.length);
            streamedFollowUp = followUpNow;
            send("next_prompt_delta", { turnId: answerTurnId, text });
          }
        }
      });

      answerTurnId = result.answeredTurn?.id || answerTurnId;

      const streamSafeResult = JSON.parse(JSON.stringify(result));
      if (streamSafeResult.answeredTurn) {
        streamSafeResult.answeredTurn.evaluationSummary = streamedEvaluation ? "" : streamSafeResult.answeredTurn.evaluationSummary;
      }

      send("result", streamSafeResult);

      if (answerTurnId) {
        const fullEvaluation = result.answeredTurn?.evaluationSummary || "";
        if (fullEvaluation) {
          if (!evaluationStarted) {
            send("evaluation_start", { turnId: answerTurnId });
            evaluationStarted = true;
          }
          if (fullEvaluation.length > streamedEvaluation.length) {
            send("evaluation_delta", {
              turnId: answerTurnId,
              text: fullEvaluation.slice(streamedEvaluation.length)
            });
          }
          send("evaluation_done", { turnId: answerTurnId });
        }
      }

      const nextTurnId = result.interview?.activeTurn?.id || "";
      const fullNextPrompt = result.interview?.activeTurn?.prompt || "";
      if (nextTurnId && fullNextPrompt) {
        send("next_prompt_start", { turnId: nextTurnId });
        send("next_prompt_delta", { turnId: nextTurnId, text: fullNextPrompt });
        send("next_prompt_done", { turnId: nextTurnId });
      } else if (nextPromptStarted && answerTurnId) {
        send("next_prompt_done", { turnId: answerTurnId });
      }

      send("status", { phase: "completed", message: "评估完成" });
      send("done", { ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send("error", { message });
    } finally {
      res.end();
    }
  }

  private tryExtractJsonStringField(raw: string, field: string) {
    const key = `"${field}"`;
    const keyIndex = raw.indexOf(key);
    if (keyIndex < 0) {
      return "";
    }

    const colonIndex = raw.indexOf(":", keyIndex + key.length);
    if (colonIndex < 0) {
      return "";
    }

    let start = colonIndex + 1;
    while (start < raw.length && /\s/.test(raw[start])) {
      start += 1;
    }
    if (start >= raw.length || raw[start] !== "\"") {
      return "";
    }

    let i = start + 1;
    let escaped = false;
    let encoded = "";
    while (i < raw.length) {
      const ch = raw[i];
      if (!escaped && ch === "\"") {
        try {
          return JSON.parse(`"${encoded}"`) as string;
        } catch {
          return "";
        }
      }
      if (!escaped && ch === "\\") {
        escaped = true;
        encoded += ch;
      } else {
        encoded += ch;
        escaped = false;
      }
      i += 1;
    }

    return "";
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Force completion and generate the interview report" })
  @ApiParam({ name: "id", description: "Interview UUID" })
  complete(@Param("id") id: string) {
    return this.interviewsService.complete(id);
  }
}
