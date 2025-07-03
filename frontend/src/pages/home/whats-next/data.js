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
        title: "AAs",
        levelOfEffort: "Large",
        status: "In Progress-Testing",
        expandedHeading: "Feature Functionality",
        expandedDescription: "Viewing, creating and editing Assisted Acquisitions (AAs) agreements"
    },
    {
        id: 2,
        priority: 2,
        title: "Grants",
        levelOfEffort: "Large",
        status: "In Progress-Research",
        expandedHeading: "Feature Functionality",
        expandedDescription: "Viewing, creating and editing Grants"
    }
];
