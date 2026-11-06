import type { BridgeRequest, BridgeResponse } from "@ifsoul/adapter-sdk";
/** Original game-owned synthetic dialogue; no model or factual recall. */
export function exampleScenarioResponse(
  request: BridgeRequest,
): BridgeResponse {
  return {
    choiceId: request.fallbackChoiceId,
    source: "scenario",
    speech:
      request.language === "ru"
        ? "Сыграем ещё одну партию?"
        : "Shall we play another hand?",
  };
}
