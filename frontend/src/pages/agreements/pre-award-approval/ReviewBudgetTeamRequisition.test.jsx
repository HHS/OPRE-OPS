import { describe, it, expect, vi } from "vitest";
import { ReviewBudgetTeamRequisition } from "./ReviewBudgetTeamRequisition";

// Mock the data hook
vi.mock("./usePreAwardApprovalData", () => ({
    default: vi.fn()
}));

// Mock lookup hooks
vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetAgreementName: () => "Test Agreement"
}));

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "John Doe"
}));

// Mock react-redux
vi.mock("react-redux", () => ({
    useSelector: vi.fn()
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
    useParams: () => ({ id: "1" })
}));

describe("ReviewBudgetTeamRequisition", () => {
    it("component exports correctly", () => {
        expect(ReviewBudgetTeamRequisition).toBeDefined();
        expect(typeof ReviewBudgetTeamRequisition).toBe("function");
    });

    it("component is a valid React component", () => {
        expect(ReviewBudgetTeamRequisition.name).toBe("ReviewBudgetTeamRequisition");
    });
});
