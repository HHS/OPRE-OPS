/*
TODO: update this data with actual release notes
NOTE: This file contains the release notes data for the OPS application.
NOTE: Each release is an object with a version, date, and an array of changes.
NOTE: Each change has an id, subject, type, and description.
NOTE: types of changes are 'New Feature', 'Improvements', 'Fixes'
*/
export const data = [
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
