export const LEVELS_OF_EFFORT = {
    LARGE: "Large",
    MEDIUM: "Medium",
    SMALL: "Small"
};

export const STATUSES = {
    NOT_STARTED: "Not Started",
    RESEARCH: "In Progress-Research",
    DESIGN: "In Progress-Design",
    DEVELOPMENT: "In Progress-Development",
    TESTING: "In Progress-Testing",
    COMPLETED: "Completed"
};

/** Statuses that group a priority under "Currently Developing" on the home page. */
export const IN_PROGRESS_STATUSES = [STATUSES.RESEARCH, STATUSES.DESIGN, STATUSES.DEVELOPMENT, STATUSES.TESTING];
