import type { GameMountOptions, MountedGame } from "@ifsoul/adapter-sdk";
import {
  decisionContext,
  handValue,
  shuffledDeck,
  winner,
  type Card,
} from "./rules.js";
import "./style.css";

function append(parent: Node, ...children: Node[]) {
  for (const child of children) parent.appendChild(child);
}

export async function mount(
  container: HTMLElement,
  options: GameMountOptions,
): Promise<MountedGame> {
  const root = document.createElement("section");
  root.className = "soul-cards";
  root.setAttribute("aria-label", "Friendly 21 card game");
  root.tabIndex = 0;
  append(container, root);
  let round = 0,
    player: Card[] = [],
    companion: Card[] = [],
    deck: Card[] = [],
    phase: "player" | "companion" | "result" = "player";
  let playerWins = 0,
    companionWins = 0,
    decisions = 0,
    roundDecisions = 0,
    epoch = 0,
    paused = false,
    destroyed = false,
    busy = false;
  let speech = "Five rounds. A little luck, a little nerve. Ready?",
    status = "",
    source = "";
  const name = options.character.name;
  let matchId = globalThis.crypto.randomUUID();
  const draw = () => deck.pop()!;
  const valid = (token: number) =>
    !destroyed && !paused && !options.signal.aborted && epoch === token;
  function button(label: string, action: string, disabled = false) {
    const b = document.createElement("button");
    b.textContent = label;
    b.dataset.action = action;
    b.disabled = disabled;
    return b;
  }
  function hand(label: string, cards: Card[], hidden: boolean) {
    const area = document.createElement("div");
    area.className = "sc-hand";
    const title = document.createElement("h3");
    title.textContent = `${label} · ${hidden ? "cards hidden" : handValue(cards)}`;
    append(area, title);
    const row = document.createElement("div");
    row.className = "sc-card-row";
    for (const card of cards) {
      const tile = document.createElement("span");
      tile.className = `sc-card${hidden ? " sc-hidden" : ""}`;
      tile.textContent = hidden
        ? "✦"
        : `${({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[card.rank] ?? card.rank} ${card.suit}`;
      tile.setAttribute(
        "aria-label",
        hidden ? "Face-down card" : tile.textContent,
      );
      append(row, tile);
    }
    append(area, row);
    return area;
  }
  function render() {
    if (destroyed) return;
    const focused = root.contains(document.activeElement);
    const focusedAction = (document.activeElement as HTMLElement | null)
      ?.dataset.action;
    root.replaceChildren();
    const eyebrow = document.createElement("p");
    eyebrow.className = "sc-eyebrow";
    eyebrow.textContent = `FRIENDLY 21 / ROUND ${round} OF 5`;
    const heading = document.createElement("h2");
    heading.textContent = `At the table with ${name}`;
    const score = document.createElement("p");
    score.textContent = `You ${playerWins} · ${name} ${companionWins} · ties add no points`;
    const table = document.createElement("div");
    table.className = "sc-table";
    append(
      table,
      hand(name, companion, phase === "player"),
      hand("You", player, false),
    );
    const message = document.createElement("p");
    message.className = "sc-speech";
    message.setAttribute("aria-live", "polite");
    message.textContent = `${name}: “${speech}”${source ? ` · ${source}` : ""}`;
    const state = document.createElement("p");
    state.setAttribute("role", "status");
    state.textContent = paused
      ? "Paused. Your table is saved while you visit another tab."
      : status;
    const controls = document.createElement("div");
    controls.className = "sc-controls";
    append(
      controls,
      button("Hit · H", "hit", paused || phase !== "player"),
      button("Stand · S", "stand", paused || phase !== "player"),
    );
    if (phase === "result")
      append(
        controls,
        button(
          round === 5 ? "Play another match" : "Next round",
          "next",
          paused,
        ),
      );
    const rules = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Simple rules & controls";
    const copy = document.createElement("p");
    copy.textContent =
      "Five rounds, usually 2–4 minutes. Closest to 21 wins; over 21 loses. Aces count as 1 or 11, face cards as 10. You play first; both hands stay hidden from the opponent until their turn ends. A fresh shuffled 52-card deck each round. No bets, splits, insurance or blackjack bonuses. The companion has at most two choices per round, then stands. Ties score no points. H: hit; S: stand. Use buttons with touch, Tab and Enter.";
    append(rules, summary, copy);
    append(
      root,
      eyebrow,
      heading,
      score,
      table,
      message,
      state,
      controls,
      rules,
    );
    if (focused) {
      const nextFocus = focusedAction
        ? root.querySelector<HTMLButtonElement>(
            `button[data-action="${focusedAction}"]:not(:disabled)`,
          )
        : null;
      (nextFocus ?? root).focus({ preventScroll: true });
    }
  }
  function startRound() {
    epoch++;
    round++;
    roundDecisions = 0;
    deck = shuffledDeck();
    player = [draw(), draw()];
    companion = [draw(), draw()];
    phase = "player";
    source = "";
    status = "Your turn. Hit for another card, or stand.";
    render();
  }
  function finish() {
    phase = "result";
    const result = winner(player, companion);
    if (result === "player") playerWins++;
    if (result === "companion") companionWins++;
    status = `${result === "tie" ? "Round tied" : result === "player" ? "You win the round" : `${name} wins the round`}. You: ${handValue(player)}; ${name}: ${handValue(companion)}.${round === 5 ? ` Match complete: ${playerWins === companionWins ? "a tie" : playerWins > companionWins ? "you win" : `${name} wins`}.` : ""}`;
    const reportId = `${matchId}:round:${round}`;
    options.bridge.report({ id: reportId, summary: status, kind: "outcome" });
    render();
    const token = epoch;
    void options.bridge
      .speak({
        requestId: `${reportId}:reaction`,
        context: `Friendly 21 host-confirmed outcome: ${status} Give one short sportsmanlike reaction.`,
      })
      .then((reply) => {
        if (valid(token) && phase === "result") {
          speech = reply.speech.slice(0, 500);
          source = reply.source;
          render();
        }
      })
      .catch(() => {});
  }
  async function companionTurn() {
    if (busy || paused || destroyed || phase !== "companion") return;
    busy = true;
    const token = epoch;
    try {
      while (valid(token) && phase === "companion") {
        if (
          handValue(companion) >= 21 ||
          roundDecisions >= 2 ||
          decisions >= 10
        ) {
          finish();
          break;
        }
        roundDecisions++;
        decisions++;
        status = `${name} is choosing…`;
        render();
        const fallback =
          handValue(companion) <
          (options.character.temperament === "bold" ? 18 : 16)
            ? "hit"
            : "stand";
        let choice = fallback;
        try {
          const reply = await options.bridge.decide({
            requestId: `${matchId}:${round}:${roundDecisions}`,
            context: decisionContext(round, companion, player.length),
            choices: [
              { id: "hit", label: "Take one card" },
              { id: "stand", label: "Keep this hand" },
            ],
            fallbackChoiceId: fallback,
          });
          if (!valid(token)) break;
          choice =
            reply.choiceId === "hit" || reply.choiceId === "stand"
              ? reply.choiceId
              : fallback;
          speech = reply.speech.slice(0, 500);
          source = reply.source;
        } catch {
          if (!valid(token)) break;
          speech = "I’ll use the table’s simple fallback for this turn.";
          source = "fallback";
        }
        if (choice === "stand") {
          finish();
          break;
        }
        companion.push(draw());
        render();
      }
    } finally {
      busy = false;
      if (!destroyed && !paused && phase === "companion" && token !== epoch)
        void companionTurn();
    }
  }
  function act(action: string) {
    if (paused || destroyed) return;
    if (action === "next" && phase === "result") {
      if (round === 5) {
        matchId = globalThis.crypto.randomUUID();
        round = 0;
        decisions = 0;
        playerWins = 0;
        companionWins = 0;
      }
      startRound();
    } else if (phase === "player" && (action === "hit" || action === "stand")) {
      if (action === "hit") player.push(draw());
      if (action === "stand" || handValue(player) >= 21) {
        phase = "companion";
        if (handValue(player) > 21) finish();
        else void companionTurn();
      }
      render();
    }
  }
  const click = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-action]",
    );
    if (target && !target.disabled) act(target.dataset.action!);
  };
  const key = (event: KeyboardEvent) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)
    )
      return;
    if (["h", "s"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      act(event.key.toLowerCase() === "h" ? "hit" : "stand");
    }
  };
  const game: MountedGame = {
    pause() {
      if (destroyed || paused) return;
      paused = true;
      epoch++;
      render();
    },
    resume() {
      if (destroyed) return;
      paused = false;
      render();
      void companionTurn();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      epoch++;
      root.removeEventListener("click", click);
      root.removeEventListener("keydown", key);
      options.signal.removeEventListener("abort", game.destroy);
      root.remove();
    },
  };
  root.addEventListener("click", click);
  root.addEventListener("keydown", key);
  options.signal.addEventListener("abort", game.destroy, { once: true });
  if (options.signal.aborted) game.destroy();
  else startRound();
  return game;
}
