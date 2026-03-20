export const ROWS_PER_COLUMN = 4;
export const NUM_COLUMNS = 4;
export const UNKNOWN_PORTFOLIO_COLUMN = 4;

/**
 * Static order for portfolios by division and abbreviation
 * This defines the display order for the portfolio budget summary card
 * Each entry includes a `column` (1-4) for explicit grid placement.
 */
export const PORTFOLIO_ORDER = [
    // Column 1 - DCFD Division
    {
        abbreviation: "CC",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-cc)",
        column: 1
    },
    {
        abbreviation: "CWR",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-cw)", // Bright Blue
        aliases: ["CW"],
        column: 1
    },
    {
        abbreviation: "HS",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-hs)", // Light Blue
        column: 1
    },
    {
        abbreviation: "OTIP",
        division: "DCFD",
        color: "var(--portfolio-bar-graph-otip)", // Light Blue
        column: 1
    },

    // Column 2 - DFS Division
    {
        abbreviation: "ADR",
        division: "DFS",
        color: "var(--portfolio-bar-graph-ad)", // Red
        aliases: ["AD"],
        column: 2
    },
    {
        abbreviation: "HMRF",
        division: "DFS",
        color: "var(--portfolio-bar-graph-hmrf)", // Coral
        column: 2
    },
    {
        abbreviation: "HV",
        division: "DFS",
        color: "var(--portfolio-bar-graph-hv)", // Light Coral
        column: 2
    },
    {
        abbreviation: "DV",
        division: "DFS",
        color: "var(--portfolio-bar-graph-dv)", // Light Coral
        column: 2
    },

    // Column 3 - DEI Division & OD
    {
        abbreviation: "WR",
        division: "DEI",
        color: "var(--portfolio-bar-graph-wr)", // Dark Green
        column: 3
    },
    {
        abbreviation: "DO",
        division: "DECONI",
        color: "var(--portfolio-bar-graph-dd)", // Gold
        aliases: ["DD"],
        column: 3
    },
    {
        abbreviation: "OD",
        division: "OD",
        color: "var(--portfolio-bar-graph-od)", // Gold
        column: 3
    },

    // Column 4 - Non-OPRE & OCDO
    {
        abbreviation: "Non-OPRE",
        division: "OD",
        color: "var(--portfolio-bar-graph-none-opre)", // Gray
        aliases: ["NON-OPRE"],
        column: 4
    },
    {
        abbreviation: "OCDO",
        division: "OCDO",
        color: "var(--portfolio-bar-graph-ocdo)", // Dark Gray
        column: 4
    }
];

/**
 * Fallback color for portfolios not in PORTFOLIO_ORDER
 */
export const FALLBACK_COLOR = "var(--data-viz-bl-by-status-1)";
