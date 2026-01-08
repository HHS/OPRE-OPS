/**
 * Static order for portfolios by division and abbreviation
 * This defines the display order for the portfolio budget summary card
 * Arranged in 4-column grid: [CC, CWR, HS] [AD, HMRF, HV] [WR, OD] [Non-OPRE, OCDO]
 *
 * TODO: Move these color definitions to a global CSS file with proper theming
 */
export const PORTFOLIO_ORDER = [
    // Column 1 - DCFD Division
    {
        abbreviation: "CC",
        division: "DCFD",
        color: "#1b4480" // Dark Blue
    },
    {
        abbreviation: "CWR",
        division: "DCFD",
        color: "#2491ff", // Bright Blue
        aliases: ["CW"] // Handle alternative abbreviations
    },
    {
        abbreviation: "HS",
        division: "DCFD",
        color: "#97d4ea" // Light Blue
    },

    // Column 2 - DFS Division
    {
        abbreviation: "ADR",
        division: "DFS",
        color: "#cd425b", // Red
        aliases: ["ADR"] // Handle alternative abbreviations
    },
    {
        abbreviation: "HMRF",
        division: "DFS",
        color: "#e47464" // Coral
    },
    {
        abbreviation: "HV",
        division: "DFS",
        color: "#f2938c" // Light Coral
    },

    // Column 3 - DEI Division & OD
    {
        abbreviation: "WR",
        division: "DEI",
        color: "#4d8055" // Dark Green
    },
    {
        abbreviation: "OD",
        division: "OD",
        color: "#fac922" // Gold
    },

    // Column 4 - Non-OPRE & OCDO
    {
        abbreviation: "Non-OPRE",
        division: null,
        color: "#757575", // Gray
        aliases: ["NON-OPRE"] // Handle case variations
    },
    {
        abbreviation: "OCDO",
        division: "OCDO",
        color: "#3d4551" // Dark Gray
    }
];

/**
 * Fallback color for portfolios not in PORTFOLIO_ORDER
 */
export const FALLBACK_COLOR = "var(--data-viz-bl-by-status-1)";
