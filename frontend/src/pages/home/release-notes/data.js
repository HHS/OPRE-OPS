/*
TODO: update this data with actual release notes
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
            },
        ]
    }
];
