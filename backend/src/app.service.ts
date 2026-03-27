import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      framework: "nestjs",
      timestamp: new Date().toISOString()
    };
  }
}
