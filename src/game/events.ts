/** Roles describe actual host actions, never authority or verified identity. */
export function cardActionEvent(
  id: string,
  actor: "user" | "agent",
  action: "hit" | "stand",
) {
  return {
    id,
    kind: "progress" as const,
    actor,
    observer: "user" as const,
    recipient: "unknown" as const,
    summary: `${actor === "user" ? "The player" : "The companion"} ${action === "hit" ? "drew one card" : "stood with their hand"}.`,
  };
}
export function cardOutcomeEvent(id: string, summary: string) {
  return {
    id,
    summary,
    kind: "outcome" as const,
    actor: "host" as const,
    observer: "user" as const,
    recipient: "unknown" as const,
  };
}
