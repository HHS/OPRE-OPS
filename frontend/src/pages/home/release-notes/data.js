/*
NOTE: This file contains the release notes data for the OPS application.
NOTE: Each release is an object with a version, date, and an array of changes.
NOTE: Each change has an id, subject, type, and description.
NOTE: types of changes are 'New Feature', 'Improvements', 'Fixes'
*/
export const data = [
    {
        releaseDate: "2025-07-23",
        version: "1.147.1",
        changes: [
            {
                id: "0001",
                subject: "Overcome by Events (OBE) budget lines",
                type: "New Feature",
                description:
                    "Any budget lines that have been defined as “overcome by events” or no longer happening have been labeled as such. These budget lines remain included in the agreement total, but are not subtracted from any CANs or your budget."
            },
            {
                id: "0002",
                subject: "Editing procurement shops with approvals",
                type: "New Feature",
                description:
                    "Now when you edit a procurement shop on an agreement, it will trigger an approval from your Division Director so they can maintain oversight on budget changes and any changes to budget line fees that might impact the agreement total."
            },
            {
                id: "0003",
                subject: "Agreements updated with correct procurement shops",
                type: "New Feature",
                description:
                    "All agreements in OPS have been recently updated with their correct procurement shop. However, the fee rate of each procurement shop is not currently displayed, but will be soon. This means your agreement totals might still be a little off until the total fees are applied.."
            },
            {
                id: "0004",
                subject: "Number formatting on exports",
                type: "Improvements",
                description:
                    "When you export a spreadsheet from OPS, columns for currency ($) will now appear as plain text which enables pivot tables and calculations on the data."
            }
        ]
    },
    {
        releaseDate: "2025-07-02",
        version: "1.135.0",
        changes: [
            {
                id: "0001",
                subject: "OPS Release Notes & What's Next",
                type: "New Feature",
                description:
                    "You can now view details about what's new and what's next directly in OPS instead of referencing the google document."
            },
            {
                id: "0002",
                subject: "Sorting on Table Columns",
                type: "Improvements",
                description:
                    "You can now click on any column in a table to change how the table is sorted from top to bottom."
            },
            {
                id: "0003",
                subject: "Alphabetical Sorting on Team Members Selection/Dropdown Menu",
                type: "Improvements",
                description:
                    "When you add a Project Officer or team member to an agreement, the list of OPRE staff is now sorted alphabetically by first name so it’s easier to find a specific individual."
            },
            {
                id: "0004",
                subject: "Division Directors & Team Leaders Included as Editors on Their Agreements",
                type: "Improvements",
                description:
                    "Division Directors and Team Leaders will be automatically added as team members to any agreements using their Portfolios/Division’s CANs. This will also enable them to edit those agreements."
            },
            {
                id: "0005",
                subject: "OCDO Portfolios",
                type: "Improvements",
                description: "The OCDO-related portfolios were recently added into OPS."
            }
        ]
    }
];
