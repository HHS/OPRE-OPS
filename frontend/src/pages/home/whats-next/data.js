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
        title: "Data clean-up",
        levelOfEffort: "Medium",
        status: "In-Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "The budget team has been working with each division to update data as needed. The OPS team is regularly importing these updates from the budget spreadsheet into OPS."
    },
    {
        id: 2,
        priority: 2,
        title: "Create an assisted acquisition",
        levelOfEffort: "Medium",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "This will enable users to create/enter assisted acquisitions into OPS."
    },
    {
        id: 3,
        priority: 3,
        title: "Edit an assisted acquisition",
        levelOfEffort: "Large",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "This will enable users to edit assisted acquisitions into OPS (and see all edits recorded in the agreement history)."
    },
];
