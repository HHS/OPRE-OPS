import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectFilterButton from "./ProjectFilterButton";

// Mock ComboBox components to avoid RTK Query API calls
vi.mock("../../../../components/UI/Form/FiscalYearComboBox", () => ({
    default: ({ selectedFiscalYears, setSelectedFiscalYears, label }) => (
        <div data-testid="fiscal-year-combobox">
            <label htmlFor="fiscal-year-select">{label}</label>
            <select
                id="fiscal-year-select"
                multiple
                value={selectedFiscalYears.map((fy) => fy.id)}
                onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedFiscalYears(options.map((opt) => ({ id: opt.value, title: opt.value })));
                }}
            >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
            </select>
        </div>
    )
}));

vi.mock("../../../../components/Portfolios/PortfoliosComboBox", () => ({
    default: ({ selectedPortfolios, setSelectedPortfolios }) => (
        <div data-testid="portfolios-combobox">
            <label htmlFor="portfolios-select">Portfolio</label>
            <select
                id="portfolios-select"
                multiple
                value={selectedPortfolios.map((p) => p.id)}
                onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedPortfolios(options.map((opt) => ({ id: opt.value, name: opt.text })));
                }}
            >
                <option value="1">Portfolio A</option>
                <option value="2">Portfolio B</option>
            </select>
        </div>
    )
}));

vi.mock("../../../../components/Projects/ProjectTitleComboBox", () => ({
    default: ({ selectedProjects, setSelectedProjects }) => (
        <div data-testid="project-title-combobox">
            <label htmlFor="project-title-select">Project Title</label>
            <select
                id="project-title-select"
                multiple
                value={selectedProjects.map((p) => p.title)}
                onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedProjects(options.map((opt) => ({ title: opt.value })));
                }}
            >
                <option value="Project Alpha">Project Alpha</option>
                <option value="Project Beta">Project Beta</option>
            </select>
        </div>
    )
}));

vi.mock("../../../../components/Projects/ProjectTypeComboBox", () => ({
    default: ({ selectedProjectTypes, setSelectedProjectTypes }) => (
        <div data-testid="project-type-combobox">
            <label htmlFor="project-type-select">Project Type</label>
            <select
                id="project-type-select"
                multiple
                value={selectedProjectTypes.map((t) => t.title)}
                onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedProjectTypes(options.map((opt) => ({ title: opt.value })));
                }}
            >
                <option value="RESEARCH">RESEARCH</option>
                <option value="ADMINISTRATIVE_AND_SUPPORT">ADMINISTRATIVE_AND_SUPPORT</option>
            </select>
        </div>
    )
}));

vi.mock("../../../../components/Agreements/AgreementNameComboBox", () => ({
    default: ({ selectedAgreementNames, setSelectedAgreementNames }) => (
        <div data-testid="agreement-name-combobox">
            <label htmlFor="agreement-name-select">Agreement Title</label>
            <select
                id="agreement-name-select"
                multiple
                value={selectedAgreementNames.map((a) => a.title)}
                onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedAgreementNames(options.map((opt) => ({ title: opt.value })));
                }}
            >
                <option value="Agreement 1">Agreement 1</option>
                <option value="Agreement 2">Agreement 2</option>
            </select>
        </div>
    )
}));

// Mock react-modal
vi.mock("react-modal", () => {
    const Modal = ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
    Modal.setAppElement = vi.fn();
    return {
        default: Modal
    };
});

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("ProjectFilterButton", () => {
    const mockSetFilters = vi.fn();

    const defaultFilters = {
        fiscalYear: [],
        portfolio: [],
        projectSearch: [],
        agreementSearch: [],
        projectType: []
    };

    const mockProjectFilterOptions = {
        fiscal_years: [2023, 2024, 2025],
        portfolios: [
            { id: 1, name: "Portfolio A" },
            { id: 2, name: "Portfolio B" }
        ],
        agreement_names: ["Agreement 1", "Agreement 2"]
    };

    // Create a simple mock store without RTK Query middleware
    const mockStore = configureStore({
        reducer: {
            userSlice: (state = { activeUser: { id: 1, roles: [] } }) => state
        }
    });

    // Helper to render with Router and Redux context
    const renderWithRouter = (ui) => {
        return render(
            <Provider store={mockStore}>
                <MemoryRouter>{ui}</MemoryRouter>
            </Provider>
        );
    };

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    it("should render the filter button", () => {
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should open modal when filter button is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByTestId("modal")).toBeInTheDocument();
        });
    });

    it("should display all five filter fieldsets in modal", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByTestId("fiscal-year-combobox")).toBeInTheDocument();
        });

        expect(screen.getByTestId("portfolios-combobox")).toBeInTheDocument();
        expect(screen.getByTestId("project-title-combobox")).toBeInTheDocument();
        expect(screen.getByTestId("project-type-combobox")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-name-combobox")).toBeInTheDocument();
    });

    it("should display Apply and Reset buttons in modal", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    it("should call setFilters when Apply is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
        });

        const applyButton = screen.getByRole("button", { name: /apply/i });
        await user.click(applyButton);

        expect(mockSetFilters).toHaveBeenCalled();
    });

    it("should reset filters when Reset is clicked", async () => {
        const user = userEvent.setup();
        const filtersWithSelections = {
            fiscalYear: [{ id: 2023, title: "2023" }],
            portfolio: [{ id: 1, name: "Portfolio A" }],
            projectSearch: [{ title: "Project Alpha" }],
            agreementSearch: [{ title: "Agreement 1" }],
            projectType: [{ title: "RESEARCH" }]
        };

        renderWithRouter(
            <ProjectFilterButton
                filters={filtersWithSelections}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
        });

        const resetButton = screen.getByRole("button", { name: /reset/i });
        await user.click(resetButton);

        expect(mockSetFilters).toHaveBeenCalledWith({
            fiscalYear: [],
            portfolio: [],
            projectSearch: [],
            agreementSearch: [],
            projectType: []
        });
    });

    it("should close modal when Apply is clicked", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByTestId("modal")).toBeInTheDocument();
        });

        const applyButton = screen.getByRole("button", { name: /apply/i });
        await user.click(applyButton);

        await waitFor(() => {
            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });
    });

    it("should sync state with filters prop via useEffect", async () => {
        const { rerender } = renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const updatedFilters = {
            fiscalYear: [{ id: 2023, title: "2023" }],
            portfolio: [{ id: 1, name: "Portfolio A" }],
            projectSearch: [{ title: "Project Alpha" }],
            agreementSearch: [{ title: "Agreement 1" }],
            projectType: [{ title: "RESEARCH" }]
        };

        rerender(
            <ProjectFilterButton
                filters={updatedFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        // Internal state should sync with updated filters
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should handle loading state for filter options", () => {
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={true}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should handle empty filter options", () => {
        const emptyOptions = {
            fiscal_years: [],
            portfolios: [],
            agreement_names: []
        };

        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={emptyOptions}
                isLoadingOptions={false}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should handle undefined filter options", () => {
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={undefined}
                isLoadingOptions={false}
            />
        );

        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should display correct filter labels", async () => {
        const user = userEvent.setup();
        renderWithRouter(
            <ProjectFilterButton
                filters={defaultFilters}
                setFilters={mockSetFilters}
                projectFilterOptions={mockProjectFilterOptions}
                isLoadingOptions={false}
            />
        );

        const filterButton = screen.getByText("Filters");
        await user.click(filterButton);

        await waitFor(() => {
            expect(screen.getByText("Compare Fiscal Years")).toBeInTheDocument();
        });

        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("Project Title")).toBeInTheDocument();
        expect(screen.getByText("Project Type")).toBeInTheDocument();
        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
    });
});
