import roadmapData from "./roadmapData.json";

export const getRoadmapItemsByStatus = (status) => roadmapData.filter((item) => item.status === status);
