import { describe, expect, it, vi } from "vitest";
import { getRoadmapItemsByStatus } from "./roadmapData.helpers";

vi.mock("./roadmapData.json", () => ({
    default: [
        { id: 1, title: "Login", status: "Done" },
        { id: 2, title: "Finish Procurement Tracker", status: "Currently Developing" },
        { id: 3, title: "Vendor Management", status: "Not Started Yet" }
    ]
}));

describe("getRoadmapItemsByStatus", () => {
    it("returns only the items matching the given status", () => {
        expect(getRoadmapItemsByStatus("Done")).toEqual([{ id: 1, title: "Login", status: "Done" }]);
    });

    it("returns an empty array when no items match", () => {
        expect(getRoadmapItemsByStatus("Not A Real Status")).toEqual([]);
    });
});
