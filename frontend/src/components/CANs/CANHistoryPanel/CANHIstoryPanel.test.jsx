import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
import CANHistoryPanel from "./CANHistoryPanel";

describe("CANHistoryPanel", () => {
    // const user = userEvent.setup();

    beforeEach(() => {
        // Mock any necessary providers or props here
    });

    it("renders without crashing", () => {
        render(<CANHistoryPanel canId={500} />);
        expect(screen.getByRole("region")).toBeInTheDocument();
    });

    it("displays CAN history data when provided", () => {
        const mockData = [
            { timestamp: "2023-01-01T00:00:00", id: "0x123", data: "0xFF 0x00" },
            { timestamp: "2023-01-01T00:00:01", id: "0x456", data: "0x01 0x02" }
        ];

        render(<CANHistoryPanel data={mockData} />);

        expect(screen.getByText("0x123")).toBeInTheDocument();
        expect(screen.getByText("0x456")).toBeInTheDocument();
    });

    // it('handles filter input changes', async () => {
    //   render(<CANHistoryPanel />);

    //   const filterInput = screen.getByRole('textbox', { name: /filter/i });
    //   await user.type(filterInput, '0x123');

    //   expect(filterInput).toHaveValue('0x123');
    // });

    it("shows empty state when no data is provided", () => {
        render(<CANHistoryPanel />);

        expect(screen.getByText(/no history/i)).toBeInTheDocument();
    });

    // it("allows toggling of auto-scroll", async () => {
    //     render(<CANHistoryPanel />);

    //     const autoScrollToggle = screen.getByRole("checkbox", { name: /auto-scroll/i });
    //     await user.click(autoScrollToggle);

    //     expect(autoScrollToggle).toBeChecked();
    // });
});
