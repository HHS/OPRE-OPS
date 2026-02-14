/*
    NOTE: This file contains data for the WhatsNextTable component.
    NOTE: The available statuses are "Not Started", "In Progress-Research", "In Progress-Design", "In Progress-Development", "In Progress-Testing", "Completed"
    NOTE: The available levels of effort are "Large", "Medium", "Small"
    NOTE: It will be sorted by priority in ascending order. 1, 2, 3, etc.
    NOTE: The expandedHeading and expandedDescription are used to display additional information when the row is expanded. Fallbacks are provided if they are not available.
 */

export const data = [
    {
        id: 1,
        priority: 1,
        title: "Updating FY26 Spend Plans",
        levelOfEffort: "Medium",
        status: "In-Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "The budget team is working with each OPRE Division to update their FY26 spend plans in OPS."
    },
    {
        id: 2,
        priority: 2,
        title: "Procurement Tracker",
        levelOfEffort: "Large",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription: "This will enable users to track/update the procurement process within OPS instead of using the Procurement Tracker Spreadsheet"
    },
    {
        id: 3,
        priority: 3,
        title: "Procurement Dashboard",
        levelOfEffort: "Medium",
        status: "In Progress-Design",
        expandedHeading: "Description",
        expandedDescription:
            "This will enable the Procurement Team to view a procurement overview or summary across all agreements."
    }
];
