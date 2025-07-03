/*
TODO: update this data with actual release notes
NOTE: This file contains the release notes data for the OPS application.
NOTE: Each release is an object with a version, date, and an array of changes.
NOTE: Each change has an id, subject, type, and description.
NOTE: types of changes are 'New Feature', 'Improvements', 'Fixes'
*/
export const data = [
    {
        version: "1.134.0",
        date: "2025-07-02",
        changes: [
            {
                id: "d9339fc",
                subject: "In-App Release Notes",
                type: "New Feature",
                description: "Adds in-app Release Notes and What's Next tabs for the home page after log in. (cf983ba)"
            }
        ]
    },
    {
        version: "1.133.0",
        date: "2025-07-02",
        changes: [
            {
                id: "cf983ba",
                subject: "Contract Type Updates",
                type: "Improvements",
                description: "Update contract type from Labor Hour (LH) to Firm Fixed Price (FFP) (cf983ba)"
            }
        ]
    },
    {
        version: "1.132.0",
        date: "2025-07-02",
        changes: [
            {
                id: "e791738",
                subject: "Data Type in Exports",
                type: "Improvements",
                description: "export: enhance XLSX export functionality with currency formatting (e791738)"
            }
        ]
    },
    {
        version: "1.129.0",
        date: "2025-06-24",
        changes: [
            {
                id: "a2cb655",
                subject: "CSRF Protection",
                type: "New Feature",
                description: "Enhanced CSRF protection by allowing OPTIONS and HEAD methods. (a2cb655)"
            },
            {
                id: "21749dd",
                subject: "CSRF Protection",
                type: "New Feature",
                description: "Excluded health check endpoint from CSRF protection in Azure environments. (21749dd)"
            }
        ]
    },
    {
        version: "1.128.0",
        date: "2025-06-24",
        changes: [
            {
                id: "ebf278c",
                subject: "CSRF Protection",
                type: "New Feature",
                description:
                    "Enhanced CSRF protection by validating Host and Referer headers in Azure environments. (ebf278c)"
            },
            {
                id: "b27e5c7",
                subject: "CSRF Protection",
                type: "New Feature",
                description: "Implemented CSRF protection for Azure environments with header validation. (b27e5c7)"
            },
            {
                id: "10a3308",
                subject: "CSRF Protection",
                type: "New Feature",
                description: "Provided an initial basic CSRF prevention to check Host and Referer. (10a3308)"
            },
            {
                id: "a13744c",
                subject: "CSRF Protection",
                type: "New Feature",
                description: "Updated CSRF protection Host header prefix for production environment. (a13744c)"
            }
        ]
    },
    {
        version: "1.127.1",
        date: "2025-06-23",
        changes: [
            {
                id: "1df474e",
                subject: "Dependencies",
                type: "Fixes",
                description: "deps: update minor dependencies (1df474e)"
            },
            {
                id: "b80cb96",
                subject: "Testing",
                type: "Fixes",
                description: "updates tests and adds fallback chain (b80cb96)"
            }
        ]
    },
    {
        version: "1.127.0",
        date: "2025-06-23",
        changes: [
            {
                id: "9efbeea",
                subject: "BLIRow Component",
                type: "Improvements",
                description: "Add optional chaining for procurement_shop properties in BLIRow component. (9efbeea)"
            },
            {
                id: "bd407f8",
                subject: "Currency Summary Card",
                type: "Improvements",
                description: "Remove fee percentage display from currency summary card. (bd407f8)"
            },
            {
                id: "8981c94",
                subject: "Fee Display Logic",
                type: "Fixes",
                description: "Update fee display logic to fallback on fee percentage. (8981c94)"
            },
            {
                id: "07f45b3",
                subject: "Testing",
                type: "Fixes",
                description: "Update mockBudgetLine structure and adjust fee rate display in tests. (07f45b3)"
            },
            {
                id: "2792768",
                subject: "BLIRow and AllBLIRow Components",
                type: "New Feature",
                description: "Enhance fee rate display in BLIRow and AllBLIRow components. (2792768)"
            },
            {
                id: "04f7b31",
                subject: "Procurement Shop Schema",
                type: "New Feature",
                description:
                    "Enhance procurement shop schema with created/updated fields and fees management. (04f7b31)"
            }
        ]
    }
];
