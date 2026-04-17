export const agentTownTokens = {
  color: {
    ochre500: "#c4883a",
    sand100: "#f5e6c8",
    sand200: "#e8d5a8",
    rust600: "#a0522d",
    teal600: "#5b8a8a",
    brass700: "#8b7d3c",
    wood950: "#2e1b0e",
    cream50: "#fff8e8",
    sun200: "#ffe4a0",
    sky100: "#c2e6ff",
    sky300: "#8dc8f0",
    sky500: "#6bb0dd",
    sky600: "#5b9bd5",
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  motion: {
    fastMs: 140,
    baseMs: 220,
    slowMs: 360,
  },
} as const;

export type AgentTownTokens = typeof agentTownTokens;
