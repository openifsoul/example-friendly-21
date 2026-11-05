import test from "node:test";
import assert from "node:assert/strict";
import {
  handValue,
  winner,
  decisionContext,
  shuffledDeck,
  type Card,
} from "../src/game/rules";
const cards = (...ranks: number[]): Card[] =>
  ranks.map((rank) => ({ rank, suit: "♠" }));
test("aces soften repeatedly and face cards count ten", () => {
  assert.equal(handValue(cards(1, 1, 9)), 21);
  assert.equal(handValue(cards(1, 1, 9, 10)), 21);
  assert.equal(handValue(cards(1, 13)), 21);
});
test("bust loses; equal totals tie without blackjack bonuses", () => {
  assert.equal(winner(cards(13, 12, 5), cards(10, 8)), "companion");
  assert.equal(winner(cards(10, 9), cards(13, 9)), "tie");
  assert.equal(winner(cards(10, 9), cards(10, 12, 2)), "player");
});
test("inference context cannot contain the hidden opponent hand or deck", () => {
  const context = decisionContext(2, cards(7, 8), 3);
  assert.match(context, /7♠, 8♠/);
  assert.match(context, /3 face-down cards/);
  assert.match(context, /remaining deck are unknown/);
  assert.equal(context.includes("Opponent total:"), false);
});
test("shuffle preserves every original card exactly once", () => {
  const deck = shuffledDeck(() => 0.3);
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((c) => `${c.rank}${c.suit}`)).size, 52);
});
