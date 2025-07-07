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
        title: "Procurement shops & fees",
        levelOfEffort: "Large",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "We are working to make the procurement shop fee rates dynamic, so that if a fee changes, all budget lines using that shop will automatically receive the new fee rate. There will also be an approval required to change the procurement shop on an agreement, as it changes the total agreement amount. Currently, you will see Fee Amounts on each budget line, but the Agreement Total does not yet include the fees."
    },
    {
        id: 3,
        priority: 3,
        title: "Assisted Acquisitions",
        levelOfEffort: "Large",
        status: "In Progress-Design",
        expandedHeading: "Description",
        expandedDescription:
            "OPS has so far been mostly developed around contracts, but we are now working to add in other agreement types, starting with assisted acquisitions. This means you’ll be able to create, view, and edit assisted acquisitions in addition to contracts."
    },
    {
        id: 4,
        priority: 4,
        title: "Login improvements",
        levelOfEffort: "Small",
        status: "In Progress-Design",
        expandedHeading: "Description",
        expandedDescription:
            "We are working on an improvement to the login experience so you can see when there are issues that require further action to resolve"
    }
];
