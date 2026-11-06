import test from "node:test";
import assert from "node:assert/strict";
import { cardActionEvent, cardOutcomeEvent } from "../src/game/events";
test("card event source separates player actions, companion actions and rule outcomes", () => {
  assert.deepEqual(cardActionEvent("draw", "user", "hit"), {
    id: "draw",
    kind: "progress",
    actor: "user",
    observer: "user",
    recipient: "unknown",
    summary: "The player drew one card.",
  });
  assert.equal(cardActionEvent("stand", "agent", "stand").actor, "agent");
  assert.equal(cardOutcomeEvent("round", "Round tied.").actor, "host");
});
