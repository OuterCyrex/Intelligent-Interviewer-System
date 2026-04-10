import type { Position } from "../types/domain";
import { requestJson } from "../utils/request";

export function fetchPositions(baseUrl: string) {
  return requestJson<Position[]>(baseUrl, "/positions");
}
