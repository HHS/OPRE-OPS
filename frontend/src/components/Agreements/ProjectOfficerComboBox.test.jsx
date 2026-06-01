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
    default: ({ selectedData, setSelectedData }) => (
        <div data-testid="combobox">
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
});
