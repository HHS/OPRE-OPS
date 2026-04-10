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
        title: "Continue Procurement Tracker",
        levelOfEffort: "Medium",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "The Procurement Tracker is available up through pre-award / step 5. We are still finishing up the pre-award requisition for the budget team, and then will continue onto award/step 6 which will complete the procurement tracker."
    },
    {
        id: 2,
        priority: 2,
        title: "Projects Spending & Funding",
        levelOfEffort: "Medium",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "Each project now has its own page that will include a tab for details, spending and funding. The spending and funding tabs are currently in-progress to display what agreements are included within each project and where the funding is coming from."
    },
    {
        id: 3,
        priority: 3,
        title: "Procurement Dashboard",
        levelOfEffort: "Medium",
        status: "In Progress-Development",
        expandedHeading: "Description",
        expandedDescription:
            "The procurement dashboard will enable the procurement team to monitor procurement progress across all agreements and procurement steps."
    }
];
