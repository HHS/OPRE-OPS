import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CANDetailView from "./CANDetailView";

const mockProps = {
    description: "Test CAN Description",
    number: "CAN-123",
    nickname: "Test Nickname",
    portfolioName: "Test Portfolio",
    teamLeaders: [
        { id: 1, full_name: "John Doe", email: "jdoe@example.com" },
        { id: 2, full_name: "Jane Smith", email: "jsmith@example.com" }
    ],
    divisionDirectorFullName: "Director Name",
    divisionName: "Test Division",
    canHistoryItems: [
        {
            id: 1,
            can_id: 500,
            ops_event_id: 1,
            history_title: "Test History Title",
            history_message: "Test History Message",
            timestamp: "2021-01-01T00:00:00Z",
            history_type: "Test History Type"
        }
    ]
};

describe("CANDetailView", () => {
    it("renders all CAN details correctly", () => {
        render(
            <dl>
                <CANDetailView {...mockProps} />
            </dl>
        );

        // Check for basic text content
        expect(screen.getByText("Test CAN Description")).toBeInTheDocument();
        expect(screen.getByText("CAN-123")).toBeInTheDocument();
        expect(screen.getByText("Test Nickname")).toBeInTheDocument();
        expect(screen.getByText("Test Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Test Division")).toBeInTheDocument();

        // Check for team leaders
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();

        // Check for division director
        expect(screen.getByText("Director Name")).toBeInTheDocument();
    });

    it("renders history section", () => {
        render(
            <dl>
                <CANDetailView {...mockProps} />
            </dl>
        );

        expect(screen.getByText("History")).toBeInTheDocument();
        // TODO: Add more specific tests for history section
    });

    it("renders without team leaders", () => {
        render(
            <dl>
                <CANDetailView
                    {...mockProps}
                    teamLeaders={[]}
                />
            </dl>
        );

        // Verify other content still renders
        expect(screen.getByText("Test CAN Description")).toBeInTheDocument();
        expect(screen.getByText("Team Leader")).toBeInTheDocument();
    });
});
