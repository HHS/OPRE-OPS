import { LEVELS_OF_EFFORT, STATUSES } from "./constants";

export const data = [
    {
        id: 1,
        priority: 1,
        title: "AAs",
        levelOfEffort: LEVELS_OF_EFFORT.LARGE,
        status: STATUSES.TESTING,
        expandedHeading: "Feature Functionality",
        expandedDescription: "Viewing, creating and editing Assisted Acquisitions (AAs) agreements"
    },
    {
        id: 2,
        priority: 2,
        title: "Grants",
        levelOfEffort: LEVELS_OF_EFFORT.LARGE,
        status: STATUSES.RESEARCH,
        expandedHeading: "Feature Functionality",
        expandedDescription: "Viewing, creating and editing Grants"
    }
];
