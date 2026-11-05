export interface Card {
  rank: number;
  suit: "♠" | "♥" | "♦" | "♣";
}
export function handValue(cards: readonly Card[]): number {
  let total = cards.reduce((sum, card) => sum + Math.min(card.rank, 10), 0);
  if (cards.some((card) => card.rank === 1) && total + 10 <= 21) total += 10;
  return total;
}
export function winner(
  player: readonly Card[],
  companion: readonly Card[],
): "player" | "companion" | "tie" {
  const p = handValue(player),
    c = handValue(companion);
  if (p > 21) return c > 21 ? "tie" : "companion";
  if (c > 21) return "player";
  return p === c ? "tie" : p > c ? "player" : "companion";
}
export function shuffledDeck(random = Math.random): Card[] {
  const deck: Card[] = [];
  for (const suit of ["♠", "♥", "♦", "♣"] as const)
    for (let rank = 1; rank <= 13; rank++) deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}
/** Only public table information enters inference; player cards remain face down. */
export function decisionContext(
  round: number,
  companion: readonly Card[],
  playerCardCount: number,
): string {
  return `Five-round friendly 21. Round ${round}. Your cards: ${companion.map((card) => `${card.rank}${card.suit}`).join(", ")}. Your total: ${handValue(companion)}. Opponent has ${playerCardCount} face-down cards and has finished their turn. Opponent values and remaining deck are unknown. Choose hit or stand. No wagers.`;
}
