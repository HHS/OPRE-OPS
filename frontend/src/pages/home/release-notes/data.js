/*
NOTE: This file contains the release notes data for the OPS application.
NOTE: Each release is an object with a version, date, and an array of changes.
NOTE: Each change has an id, subject, type, and description.
NOTE: types of changes are 'New Feature', 'Improvements', 'Fixes'
*/
export const data = [
    {
        releaseDate: "2026-4-10",
        version: "1.355.8",
        changes: [
            {
                id: "0001",
                subject: "View a list of projects",
                type: "Improvements",
                description:
                    "You can now view a list of all projects in OPS including a breakdown of research projects vs admin & support projects. The table includes project names, types, start dates, end dates, FY totals and lifetime totals, as well as additional information on what agreements are included. You can utilize filters to search or narrow down your results, and export to download the data to an excel file."
            },
            {
                id: "0002",
                subject: "View a project",
                type: "Improvements",
                description:
                    "Each project now has its own page where you can dig into the details about that specific project. The project details tab displays a description of the project, nickname, project type, start date, end date, portfolios, research methodologies, special topics/populations and team members, as well as a history of changes. Project spending and funding information will be added soon!"
            },
            {
                id: "0003",
                subject: "Improved Loading Experience",
                type: "Improvements",
                description:
                    "We improved the loading experience by updating how tables render data. Instead of displaying partial updates or “loading…” placeholders in individual cells, data now appears in a single, fully populated view rather than updating incrementally."
            }
        ]
    },
    {
        releaseDate: "2026-3-13",
        version: "1.326.0",
        changes: [
            {
                id: "0001",
                subject: "Procurement Tracker Steps 1-4",
                type: "New Feature",
                description:
                    "If an agreement has budget lines in executing status, you can now track your progress through procurement up to step 4. Steps 1-4 include acquisition planning, pre-solicitation, solicitation, and evaluation. Step 5 (pre-award) and step 6 (award) will be developed soon!"
            },
            {
                id: "0002",
                subject: "Changing the Project For an Agreement",
                type: "Improvements",
                description:
                    "You can now change the project associated to each agreement by clicking edit on the agreement details page (only DDs, Team Leaders, CORs, ACORs, and other team members listed on each agreement can edit them)."
            },
            {
                id: "0003",
                subject: "New Agreements List",
                type: "Improvements",
                description:
                    "Based on your feedback, the agreements list page now includes new columns such as Start, End, Total and FY25 Obligated, as well as new graphs showing the total # of agreements per FY and the breakdown of agreement types. This builds on the new filters updated in the last release providing you with even more diverse ways to view your agreement data."
            },
            {
                id: "0004",
                subject: "Performance Improvements",
                type: "Improvements",
                description:
                    "We’ve made some recent performance improvements that will reduce the time it takes to sign-in or load data across tables."
            }
        ]
    },
    {
        releaseDate: "2026-2-13",
        version: "1.289.3",
        changes: [
            {
                id: "0001",
                subject: "Exporting Budget Lines From an Agreement",
                type: "New Feature",
                description:
                    "Now you can export the budget lines of a single agreement to a spreadsheet so you can manipulate the data and take external action on those budget lines."
            },
            {
                id: "0002",
                subject: "Sub-Services Components",
                type: "Improvements",
                description:
                    "A new tooltip will display on the edit and delete actions for sub-services components, reminding you that this is legacy data from MAPS that cannot be changed in the OPS user interface. If you need to edit or delete these services components, please submit a Budget Support Request through ORBIT. For more information, please check out the FAQ on “Is there a way to create sub services components, such as SC2-A, SC2-B, SC2-C?”"
            },
            {
                id: "0003",
                subject: "Compare Fiscal Years Filter",
                type: "Improvements",
                description:
                    "Based on your feedback, we made some improvements to the fiscal year filtering on the Agreements List and Budget Lines List. The Fiscal Year dropdown defaults to the current FY and lets you quickly move between individual FYs one at a time. For deeper analysis, the Filters tool allows you to compare multiple fiscal years or combine all fiscal years into one view."
            },
            {
                id: "0004",
                subject: "Portfolios List",
                type: "Improvements",
                description:
                    "Based on your feedback, the Portfolios List now includes a graph that shows a breakdown of the OPRE budget across portfolios. The table below includes a snapshot of each portfolio's FY budget, spending and available/remaining budget. Filters enable you to adjust your view by portfolio, FY budget or % budget available."
            },
            {
                id: "0005",
                subject: "Awarded Agreements",
                type: "Improvements",
                description:
                    "Awarded agreements will now display with an “Awarded” tag above the agreement title so you can quickly distinguish between new and awarded agreements."
            }
        ]
    },
    {
        releaseDate: "2025-12-5",
        version: "1.235.0",
        changes: [
            {
                id: "0001",
                subject: "Updated ORBIT Process",
                type: "Fixes",
                description:
                    "OPS-support will now be directed to ORBIT instead of emailing opre-ops-support@flexion.us This has been updated throughout OPS and in the OPS User Guide."
            },
            {
                id: "0002",
                subject: "Filter by Agreement Name",
                type: "Improvements",
                description:
                    "You can now search for a specific agreement by typing the agreement name in the agreement filter on the agreements list page. For more detailed information, check out the How-To Guide for “How to find a specific agreement”."
            },
            {
                id: "0003",
                subject: "Unsaved Changes Tag",
                type: "Improvements",
                description:
                    "We added an “unsaved changes” tag that will display when you are editing an agreement as a reminder to save & exit when you are done making changes."
            },
            {
                id: "0004",
                subject: "Save Changes Reminder Modal",
                type: "Improvements",
                description:
                    "You will now see a pop-up modal if you navigate away from edit mode without saving your changes. From here you can either save or cancel your changes before proceeding."
            },
            {
                id: "0005",
                subject: "Edit an Assisted Acquisition",
                type: "New Feature",
                description:
                    "Contracts are no longer the only agreement type available in OPS. You can now also edit details (including services components and budget lines) for assisted acquisitions."
            }
        ]
    },
    {
        releaseDate: "2025-11-14",
        version: "1.222.1",
        changes: [
            {
                id: "0001",
                subject: "Pagination on Agreements List",
                type: "Improvements",
                description:
                    "In order to improve loading time and UI consistency, we’ve added pagination to the Agreements List. Each page contains 25 rows and you can navigate between pages to find what a specific agreement."
            },
            {
                id: "0002",
                subject: "Export an Agreement",
                type: "New Feature",
                description:
                    "There is now an export button on every agreement where you can export the agreement’s services components and budget lines."
            }
        ]
    },
    {
        releaseDate: "2025-09-25",
        version: "1.194.5",
        changes: [
            {
                id: "0001",
                subject: "Agreement History Improvements",
                type: "Improvements",
                description: "The agreement history has now been enhanced to include more detailed agreement changes."
            },
            {
                id: "0002",
                subject: "View an Assisted Acquisition",
                type: "New Feature",
                description:
                    "Contracts are no longer the only agreement type available in OPS. You can now also view all details for assisted acquisitions (AAs). This includes the unique attributes to AAs such as who the agreement is between (requesting and servicing agency) or other AA-specific details. This work will also remove the alert from the top of AA agreement pages showing which agreement types are still being developed."
            },
            {
                id: "0003",
                subject: "Error Messaging for Sign-in Issues",
                type: "Improvements",
                description:
                    "Previously when encountering a sign-in issue, users were re-directed to provide their credentials again leading to confusion. We’ve now improved this scenario by displaying a clear alert banner that will explain when there is a login issue and who to contact or when your account has been de-activated and what to do next."
            }
        ]
    },
    {
        releaseDate: "2025-07-23",
        version: "1.147.1",
        changes: [
            {
                id: "0001",
                subject: "Overcome by Events (OBE) Budget Lines",
                type: "New Feature",
                description:
                    "Any budget lines that have been defined as “overcome by events” or no longer happening have been labeled as such. These budget lines remain included in the agreement total, but are not subtracted from any CANs or your budget."
            },
            {
                id: "0002",
                subject: "Editing Procurement Shops with Approvals",
                type: "New Feature",
                description:
                    "Now when you edit a procurement shop on an agreement, it will trigger an approval from your Division Director so they can maintain oversight on budget changes and any changes to budget line fees that might impact the agreement total."
            },
            {
                id: "0003",
                subject: "Agreements Updated with Correct Procurement Shops",
                type: "New Feature",
                description:
                    "All agreements in OPS have been recently updated with their correct procurement shop. However, the fee rate of each procurement shop is not currently displayed, but will be soon. This means your agreement totals might still be a little off until the total fees are applied.."
            },
            {
                id: "0004",
                subject: "Number Formatting on Exports",
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
