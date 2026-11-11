import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import { ProjectOfficerComboBox } from "./ProjectOfficerComboBox";
import { useGetUsersQuery } from "../../api/opsAPI";

vi.mock("react-router-dom", () => ({
    useNavigate: () => vi.fn()
}));

vi.mock("../../api/opsAPI", () => ({
    useGetUsersQuery: vi.fn()
}));

vi.mock("../UI/Form/ComboBox", () => ({
    default: ({ namespace, selectedData, setSelectedData, isDisabled, tooltipMsg }) => (
        <div
            data-testid="combobox"
            data-disabled={String(Boolean(isDisabled))}
            title={tooltipMsg}
        >
            {/* The real ComboBox gives react-select inputId `${namespace}-input`. */}
            <input id={`${namespace}-input`} />
            <button
                data-testid="select-user"
                onClick={() => setSelectedData({ id: 5, display_name: "Jane Doe" })}
            >
                Select
            </button>
            <button
                data-testid="clear-user"
                onClick={() => setSelectedData(null)}
            >
                Clear
            </button>
            {selectedData && <span data-testid="selected">{selectedData.display_name}</span>}
        </div>
    )
}));

describe("ProjectOfficerComboBox", () => {
    const mockSetSelectedProjectOfficer = vi.fn();
    const mockOnChange = vi.fn();
    const mockUsers = [
        { id: 5, display_name: "Jane Doe", full_name: "Jane Doe", email: "jane@example.com" },
        { id: 6, display_name: "John Smith", full_name: "John Smith", email: "john@example.com" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: null,
            isLoading: false
        });
    });

    it("calls onChange with user id when a user is selected", () => {
        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={null}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                onChange={mockOnChange}
            />
        );

        fireEvent.click(screen.getByTestId("select-user"));

        expect(mockSetSelectedProjectOfficer).toHaveBeenCalledWith({ id: 5, display_name: "Jane Doe" });
        expect(mockOnChange).toHaveBeenCalledWith("project_officer", 5);
    });

    it("calls onChange with null when the selection is cleared", () => {
        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={{ id: 5, display_name: "Jane Doe" }}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                onChange={mockOnChange}
            />
        );

        fireEvent.click(screen.getByTestId("clear-user"));

        expect(mockSetSelectedProjectOfficer).toHaveBeenCalledWith(null);
        expect(mockOnChange).toHaveBeenCalledWith("project_officer", null);
    });

    it("renders loading state", () => {
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: null,
            isLoading: true
        });

        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={null}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
            />
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("displays validation error messages", () => {
        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={null}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                messages={["This is required information"]}
                label="Project Officer"
            />
        );

        expect(screen.getByText("This is required information")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shows why the COR is locked and disables the selection (#3269)", () => {
        const message = "The COR change is in a contract modification that is in review.";
        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={mockUsers[0]}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                label="COR"
                isDisabled
                disabledMessage={message}
            />
        );

        const hint = screen.getByText(message);
        const combobox = screen.getByTestId("combobox");
        expect(hint).toBeVisible();
        expect(combobox).toHaveAttribute("data-disabled", "true");
        expect(combobox).toHaveAttribute("title", message);
        // Screen readers announce the reason with the field's group, since react-select hides a
        // disabled input from them.
        expect(screen.getByRole("group", { name: "COR" })).toHaveAccessibleDescription(message);
        // Below the field, so it doesn't push the COR box out of line with the Alternate COR box.
        expect(combobox.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("shows no locked message when enabled", () => {
        render(
            <ProjectOfficerComboBox
                selectedProjectOfficer={null}
                setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                label="COR"
            />
        );

        expect(screen.queryByTestId("combobox")).toHaveAttribute("data-disabled", "false");
        expect(screen.queryByRole("group")).not.toBeInTheDocument();
        expect(screen.queryByText(/contract modification/i)).not.toBeInTheDocument();
    });

    it("gives each box its own ids, so each label names its own input", () => {
        render(
            <>
                <ProjectOfficerComboBox
                    selectedProjectOfficer={null}
                    setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                    label="COR"
                />
                <ProjectOfficerComboBox
                    selectedProjectOfficer={null}
                    setSelectedProjectOfficer={mockSetSelectedProjectOfficer}
                    label="Alternate COR"
                    idPrefix="alternate-project-officer"
                />
            </>
        );

        const cor = screen.getByLabelText("COR");
        const alternate = screen.getByLabelText("Alternate COR");
        expect(cor).toHaveAttribute("id", "project-officer-combobox-input");
        expect(alternate).toHaveAttribute("id", "alternate-project-officer-combobox-input");
        expect(cor).not.toBe(alternate);
    });
});
