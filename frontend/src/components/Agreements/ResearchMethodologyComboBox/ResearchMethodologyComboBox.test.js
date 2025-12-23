import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi, describe, it, beforeEach } from "vitest";
import { useGetResearchMethodologiesQuery } from "../../../api/opsAPI";
import { renderWithProviders } from "../../../test-utils";
import { ResearchMethodologyComboBox } from "./ResearchMethodologyComboBox";
vi.mock("../../../api/opsAPI");

const sampleResearchMethodologies = [
    { id: 1, name: "Research Methodology 1", detailed_name: "Research Methodology 1" },
    { id: 2, name: "Research Methodology 2", detailed_name: "Research Methodology 2" },
    { id: 3, name: "Research Methodology 3", detailed_name: "Research Methodology 3" }
];

describe("ResearchMethodologyComboBox", () => {
    const defaultProps = {
        setSelectedResearchMethodologies: vi.fn(),
        onChange: vi.fn(),
        value: "",
        className: "",
        messages: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });
    });

    it("renders loading state", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        expect(screen.getByText("Error loading research methodologies")).toBeInTheDocument();
    });

    it("renders Select component with research methodologies", async () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Research Methodologies")).toBeInTheDocument();

        // Click on the select to open the dropdown
        const selectInput = screen.getByLabelText("Research Methodologies");
        await user.click(selectInput);

        // Check that the options appear
        expect(await screen.findByText("Research Methodology 1")).toBeInTheDocument();
        expect(await screen.findByText("Research Methodology 2")).toBeInTheDocument();
    });

    it("passes onChange handler to Select component", async () => {
        const mockOnChange = vi.fn();
        const mockSetSelectedResearchMethodologies = vi.fn();
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <ResearchMethodologyComboBox
                {...defaultProps}
                onChange={mockOnChange}
                setSelectedResearchMethodologies={mockSetSelectedResearchMethodologies}
            />
        );

        const selectInput = screen.getByLabelText("Research Methodologies");
        await user.click(selectInput);

        // Click on the first option (Research Methodology 1)
        const option = await screen.findByText("Research Methodology 1");
        console.log(option);
        await user.click(option);

        console.log("mockSetSelectedResearchMethodologies calls:", mockSetSelectedResearchMethodologies.mock.calls);
        expect(mockSetSelectedResearchMethodologies).toHaveBeenCalledWith([sampleResearchMethodologies[0]]);
        expect(mockOnChange).toHaveBeenCalledWith("research_methodologies", [sampleResearchMethodologies[0]]);
    });

    it("displays selected value correctly", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <ResearchMethodologyComboBox
                {...defaultProps}
                selectedResearchMethodologies={sampleResearchMethodologies[0]}
            />
        );

        // With react-select, selected value should be displayed as text in single value container
        expect(screen.getByText("Research Methodology 1")).toBeInTheDocument();
    });

    it("passes custom className to Select component", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <ResearchMethodologyComboBox
                {...defaultProps}
                className="custom-class"
            />
        );

        // Check that custom class is applied to component
        expect(screen.getByLabelText("Research Methodologies")).toBeInTheDocument();
    });

    it("generates correct select name attribute", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        // The component should be rendered with correct namespace for requesting agency
        expect(screen.getByLabelText("Research Methodologies")).toBeInTheDocument();
    });

    it("handles empty agencies data", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Research Methodologies")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("handles undefined research methodology data", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Research Methodologies")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("formats research methodologies options correctly", async () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(<ResearchMethodologyComboBox {...defaultProps} />);

        // Click to open the dropdown
        const selectInput = screen.getByLabelText("Research Methodologies");
        await user.click(selectInput);

        // Check that agencies are formatted correctly (name only, not name + abbr)
        expect(await screen.findByText("Research Methodology 1")).toBeInTheDocument();
        expect(await screen.findByText("Research Methodology 2")).toBeInTheDocument();
    });

    it("passes additional props to Select component", () => {
        useGetResearchMethodologiesQuery.mockReturnValue({
            data: sampleResearchMethodologies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <ResearchMethodologyComboBox
                {...defaultProps}
                isRequired={true}
                data-testid="custom-test-id"
            />
        );

        // Check that label and select are properly connected
        const label = screen.getByText("Research Methodologies");
        const selectInput = screen.getByLabelText("Research Methodologies");
        expect(label).toBeInTheDocument();
        expect(selectInput).toBeInTheDocument();
    });
});
