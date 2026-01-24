/**
 * Static order for portfolios by division and abbreviation
 * This defines the display order for the portfolio budget summary card
 * Arranged in 4-column grid: [CC, CWR, HS, OTIP] [ADR, HMRF, HV, DV] [WR, DO, OD] [Non-OPRE, OCDO]
 */
export const PORTFOLIO_ORDER = [
    // Column 1 - DCFD Division
    {
        abbreviation: "CC",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-cc)"
    },
    {
        abbreviation: "CWR",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-cw)", // Bright Blue
        aliases: ["CW"] // Handle alternative abbreviations
    },
    {
        abbreviation: "HS",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-hs)" // Light Blue
    },
    {
        abbreviation: "OTIP",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-otip)" // Light Blue
    },

    // Column 2 - DFS Division
    {
        abbreviation: "ADR",
        division: "DFS",
        color: "var(--portfolio-bar-graph-ad)", // Red
        aliases: ["AD"] // Handle alternative abbreviations
    },
    {
        abbreviation: "HMRF",
        division: "DFS",
        color: "var(--portfolio-bar-graph-hmrf)" // Coral
    },
    {
        abbreviation: "HV",
        division: "DFS",
        color: "var(--portfolio-bar-graph-hv)" // Light Coral
    },
    {
        abbreviation: "DV",
        division: "DFS",
        color: "var(--portfolio-bar-graph-dv)" // Light Coral
    },

    // Column 3 - DEI Division & OD
    {
        abbreviation: "WR",
        division: "DEI",
        color: "var(--portfolio-bar-graph-wr)" // Dark Green
    },
    {
        abbreviation: "DO",
        division: "DECONI",
        color: "var(--portfolio-bar-graph-dd)" // Gold
    },
    {
        abbreviation: "OD",
        division: "OD",
        color: "var(--portfolio-bar-graph-od)" // Gold
    },

    // Column 4 - Non-OPRE & OCDO
    {
        abbreviation: "Non-OPRE",
        division: "OD",
        color: "var(--portfolio-bar-graph-none-opre)", // Gray
        aliases: ["NON-OPRE"] // Handle case variations
    },
    {
        abbreviation: "OCDO",
        division: "OCDO",
        color: "var(--portfolio-bar-graph-ocdo)" // Dark Gray
    }
];

/**
 * Fallback color for portfolios not in PORTFOLIO_ORDER
 */
export const FALLBACK_COLOR = "var(--data-viz-bl-by-status-1)";
