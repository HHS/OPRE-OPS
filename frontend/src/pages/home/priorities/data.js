/*
    NOTE: This file contains the roadmap priorities shown in the Priorities Summary card on the home page.
    NOTE: The available statuses are listed in ./constants.js (STATUSES). Anything with an "In Progress-*"
          status renders under "Currently Developing"; "Not Started" renders under "Next Up".
    NOTE: The available levels of effort are "Large", "Medium", "Small".
    NOTE: It will be sorted by priority in ascending order. 1, 2, 3, etc.
    NOTE: The "Not Started" entries below came from the home page design and should be confirmed with
          the product team before each release.
 */

export const data = [
    {
        id: 1,
        priority: 1,
        title: "Finish Procurement Tracker",
        levelOfEffort: "Medium",
        status: "In Progress-Development"
    },
    {
        id: 2,
        priority: 2,
        title: "View & Edit Grants",
        levelOfEffort: "Medium",
        status: "In Progress-Development"
    },
    {
        id: 3,
        priority: 3,
        title: "Staffing/People Teams",
        levelOfEffort: "Large",
        status: "Not Started"
    },
    {
        id: 4,
        priority: 4,
        title: "Award Grants",
        levelOfEffort: "Medium",
        status: "Not Started"
    },
    {
        id: 5,
        priority: 5,
        title: "Contract Mods",
        levelOfEffort: "Medium",
        status: "Not Started"
    }
];
