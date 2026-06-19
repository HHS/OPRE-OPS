import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CLINSelector from "./CLINSelector";

describe("CLINSelector", () => {
    const mockOnAddCLIN = vi.fn();
    const budgetLineId = 123;

    const renderComponent = (props = {}) => {
        return render(<CLINSelector onAddCLIN={mockOnAddCLIN} budgetLineId={budgetLineId} {...props} />);
    };

    beforeEach(() => {
        mockOnAddCLIN.mockClear();
    });

    it("should render CLIN selector with dropdown and error message", () => {
        renderComponent();

        expect(screen.getByText("CLIN")).toBeInTheDocument();
        expect(screen.getByLabelText("CLIN")).toBeInTheDocument();
        expect(screen.getByText("This information is required to submit for approval")).toBeInTheDocument();
    });

    it("should render fixed CLIN options 1-10 in dropdown", () => {
        renderComponent();

        // Check for placeholder
        expect(screen.getByRole("option", { name: "- Select CLIN -" })).toBeInTheDocument();

        // Check for all 10 CLIN options
        expect(screen.getByRole("option", { name: "CLIN 1" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "CLIN 5" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "CLIN 10" })).toBeInTheDocument();

        // Verify dropdown has correct number of options (placeholder + 10 CLINs)
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(11);
    });

    it("should have Add CLIN button disabled initially", () => {
        renderComponent();

        const addButton = screen.getByRole("button", { name: "Add CLIN" });
        expect(addButton).toBeDisabled();
    });

    it("should enable Add CLIN button when a CLIN is selected", async () => {
        const user = userEvent.setup();
        renderComponent();

        const dropdown = screen.getByLabelText("CLIN");
        await user.selectOptions(dropdown, "1");

        const addButton = screen.getByRole("button", { name: "Add CLIN" });
        expect(addButton).not.toBeDisabled();
    });

    it("should call onAddCLIN with selected CLIN number when Add CLIN is clicked", async () => {
        const user = userEvent.setup();
        renderComponent();

        const dropdown = screen.getByLabelText("CLIN");
        await user.selectOptions(dropdown, "3");

        const addButton = screen.getByRole("button", { name: "Add CLIN" });
        await user.click(addButton);

        expect(mockOnAddCLIN).toHaveBeenCalledWith(3);
    });

    it("should pre-select current CLIN if currentClinNumber is provided", () => {
        renderComponent({ currentClinNumber: 7 });

        const dropdown = screen.getByLabelText("CLIN");
        expect(dropdown).toHaveValue("7");
    });

    it("should enable Add CLIN button when currentClinNumber is provided", () => {
        renderComponent({ currentClinNumber: 4 });

        const addButton = screen.getByRole("button", { name: "Add CLIN" });
        expect(addButton).not.toBeDisabled();
    });

    it("should allow changing selection from pre-selected CLIN", async () => {
        const user = userEvent.setup();
        renderComponent({ currentClinNumber: 2 });

        const dropdown = screen.getByLabelText("CLIN");
        expect(dropdown).toHaveValue("2");

        await user.selectOptions(dropdown, "9");

        const addButton = screen.getByRole("button", { name: "Add CLIN" });
        await user.click(addButton);

        expect(mockOnAddCLIN).toHaveBeenCalledWith(9);
    });
});
