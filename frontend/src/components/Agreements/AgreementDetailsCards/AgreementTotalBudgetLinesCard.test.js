import { render, screen } from "@testing-library/react";
import AgreementTotalBudgetLinesCard from "./AgreementTotalBudgetLinesCard";
import { vi } from "vitest";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("@nivo/bar", () => ({
    __esModule: true,
    ResponsiveBar: () => {
        return <div />;
    }
}));

vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
        ...actual,
        useState: () => [null, mockFn]
    };
});

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

describe("AgreementTotalBudgetLinesCard", () => {
    test("renders correctly with Drafts", () => {
        const countsByStatus = {
            IN_EXECUTION: 8,
            OBLIGATED: 1,
            PLANNED: 7
        };
        render(
            <AgreementTotalBudgetLinesCard
                numberOfAgreements={16}
                countsByStatus={countsByStatus}
                includeDrafts={true}
            />
        );

        expect(screen.getByText("0 Draft")).toBeInTheDocument();
        expect(screen.getByText("0 In Review")).toBeInTheDocument();
        expect(screen.getByText("7 Planned")).toBeInTheDocument();
        expect(screen.getByText("8 Executing")).toBeInTheDocument();
        expect(screen.getByText("1 Obligated")).toBeInTheDocument();
    });

    test("renders correctly without Drafts", () => {
        const countsByStatus = {
            IN_EXECUTION: 8,
            OBLIGATED: 1,
            PLANNED: 7
        };
        render(
            <AgreementTotalBudgetLinesCard
                numberOfAgreements={16}
                countsByStatus={countsByStatus}
                includeDrafts={false}
            />
        );

        expect(screen.queryByText("0 Draft")).toBeNull();
        expect(screen.queryByText("0 In Review")).toBeNull();
        expect(screen.getByText("7 Planned")).toBeInTheDocument();
        expect(screen.getByText("8 Executing")).toBeInTheDocument();
        expect(screen.getByText("1 Obligated")).toBeInTheDocument();
    });
});
