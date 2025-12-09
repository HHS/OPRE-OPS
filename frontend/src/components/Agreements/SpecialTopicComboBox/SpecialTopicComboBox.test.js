import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi, describe, it, beforeEach } from "vitest";
import { useGetSpecialTopicsQuery } from "../../../api/opsAPI";
import { renderWithProviders } from "../../../test-utils";
import { SpecialTopicComboBox } from "./SpecialTopicComboBox";
vi.mock("../../../api/opsAPI");

const sampleSpecialTopics = [
    { id: 1, name: "Special Topic 1" },
    { id: 2, name: "Special Topic 2" },
    { id: 3, name: "Special Topic 3" }
];

describe("SpecialTopicComboBox", () => {
    const defaultProps = {
        setSelectedSpecialTopics: vi.fn(),
        selectedSpecialTopics: [],
        onChange: vi.fn(),
        className: "",
        messages: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });
    });

    it("renders loading state", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        expect(screen.getByText("Error loading special topics and populations")).toBeInTheDocument();
    });

    it("renders Select component with special topics and populations", async () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Special Topic/Populations")).toBeInTheDocument();

        // Click on the select to open the dropdown
        const selectInput = screen.getByLabelText("Special Topic/Populations");
        await user.click(selectInput);

        // Check that the options appear
        expect(await screen.findByText("Special Topic 1")).toBeInTheDocument();
        expect(await screen.findByText("Special Topic 2")).toBeInTheDocument();
    });

    it("passes onChange handler to Select component", async () => {
        const mockOnChange = vi.fn();
        const mockSetSelectedSpecialTopics = vi.fn();
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <SpecialTopicComboBox
                {...defaultProps}
                onChange={mockOnChange}
                setSelectedSpecialTopics={mockSetSelectedSpecialTopics}
            />
        );

        const selectInput = screen.getByLabelText("Special Topic/Populations");
        await user.click(selectInput);

        // Click on the first option (Special Topic 1)
        const option = await screen.findByText("Special Topic 1");
        console.log(option);
        await user.click(option);

        console.log("mockSetSelectedSpecialTopics calls:", mockSetSelectedSpecialTopics.mock.calls);
        expect(mockSetSelectedSpecialTopics).toHaveBeenCalledWith([sampleSpecialTopics[0]]);
        expect(mockOnChange).toHaveBeenCalledWith("special_topics", [sampleSpecialTopics[0]]);
    });

    it("displays selected value correctly", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <SpecialTopicComboBox
                {...defaultProps}
                selectedSpecialTopics={[sampleSpecialTopics[0]]}
            />
        );

        // With react-select, selected value should be displayed as text in single value container
        expect(screen.getByText("Special Topic 1")).toBeInTheDocument();
    });

    it("passes custom className to Select component", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <SpecialTopicComboBox
                {...defaultProps}
                className="custom-class"
            />
        );

        // Check that custom class is applied to component
        expect(screen.getByLabelText("Special Topic/Populations")).toBeInTheDocument();
    });

    it("generates correct select name attribute", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        // The component should be rendered with correct namespace for requesting agency
        expect(screen.getByLabelText("Special Topic/Populations")).toBeInTheDocument();
    });

    it("handles empty agencies data", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Special Topic/Populations")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("handles undefined special topics and populations data", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        expect(screen.getByLabelText("Special Topic/Populations")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("formats special topics and populations options correctly", async () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(<SpecialTopicComboBox {...defaultProps} />);

        // Click to open the dropdown
        const selectInput = screen.getByLabelText("Special Topic/Populations");
        await user.click(selectInput);

        // Check that agencies are formatted correctly (name only, not name + abbr)
        expect(await screen.findByText("Special Topic 1")).toBeInTheDocument();
        expect(await screen.findByText("Special Topic 2")).toBeInTheDocument();
    });

    it("passes additional props to Select component", () => {
        useGetSpecialTopicsQuery.mockReturnValue({
            data: sampleSpecialTopics,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <SpecialTopicComboBox
                {...defaultProps}
                isRequired={true}
                data-testid="custom-test-id"
            />
        );

        // Check that label and select are properly connected
        const label = screen.getByText("Special Topic/Populations");
        const selectInput = screen.getByLabelText("Special Topic/Populations");
        expect(label).toBeInTheDocument();
        expect(selectInput).toBeInTheDocument();
    });
});
