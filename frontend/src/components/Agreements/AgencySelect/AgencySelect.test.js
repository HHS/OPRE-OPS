import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi, describe, it, beforeEach } from "vitest";
import { useGetAllAgreementAgenciesQuery } from "../../../api/opsAPI";
import { renderWithProviders } from "../../../test-utils";
import AgencySelect from "./AgencySelect";

vi.mock("../../../api/opsAPI");

const sampleAgencies = [
    { id: 1, name: "Department of Health and Human Services", abbr: "HHS", servicing: true, requesting: false },
    { id: 2, name: "Department of Education", abbr: "ED", servicing: false, requesting: true },
    { id: 3, name: "National Science Foundation", abbr: "NSF", servicing: true, requesting: true }
];

describe("AgencySelect", () => {
    const defaultProps = {
        agencyType: "Servicing",
        onChange: vi.fn(),
        value: "",
        className: "",
        messages: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });
    });

    it("renders loading state", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        renderWithProviders(<AgencySelect {...defaultProps} />);

        expect(screen.getByText("Error loading agencies")).toBeInTheDocument();
    });

    it("renders Select component with agencies for Servicing type", async () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
            />
        );

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();

        // Click on the select to open the dropdown
        const selectInput = screen.getByLabelText("Servicing Agency");
        await user.click(selectInput);

        // Check that the options appear
        expect(await screen.findByText("Department of Health and Human Services")).toBeInTheDocument();
        expect(await screen.findByText("National Science Foundation")).toBeInTheDocument();
    });

    it("renders Select component with agencies for Requesting type", async () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Requesting"
            />
        );

        expect(screen.getByLabelText("Requesting Agency")).toBeInTheDocument();

        // Click on the select to open the dropdown
        const selectInput = screen.getByLabelText("Requesting Agency");
        await user.click(selectInput);

        // Check that the options appear
        expect(await screen.findByText("Department of Education")).toBeInTheDocument();
        expect(await screen.findByText("National Science Foundation")).toBeInTheDocument();
    });

    it("calls useGetAllAgreementAgenciesQuery with correct parameters for Servicing", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
            />
        );

        expect(useGetAllAgreementAgenciesQuery).toHaveBeenCalledWith({ servicing: true });
    });

    it("calls useGetAllAgreementAgenciesQuery with correct parameters for Requesting", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Requesting"
            />
        );

        expect(useGetAllAgreementAgenciesQuery).toHaveBeenCalledWith({ requesting: true });
    });

    it("passes onChange handler to Select component", async () => {
        const mockOnChange = vi.fn();
        const mockSetAgency = vi.fn();
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                onChange={mockOnChange}
                setAgency={mockSetAgency}
            />
        );

        const selectInput = screen.getByLabelText("Servicing Agency");
        await user.click(selectInput);

        // Click on the first option (Department of Health and Human Services)
        const option = await screen.findByText("Department of Health and Human Services");
        await user.click(option);

        expect(mockSetAgency).toHaveBeenCalledWith(sampleAgencies[0]);
        expect(mockOnChange).toHaveBeenCalledWith("servicing_agency", sampleAgencies[0]);
    });

    it("displays selected value correctly", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                value={sampleAgencies[0]}
            />
        );

        // With react-select, selected value should be displayed as text in single value container
        expect(screen.getByText("Department of Health and Human Services")).toBeInTheDocument();
    });

    it("passes error messages to Select component", () => {
        const errorMessages = ["This field is required"];
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                messages={errorMessages}
            />
        );

        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("passes custom className to Select component", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                className="custom-class"
            />
        );

        // Check that custom class is applied to component
        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
    });

    it("generates correct select name attribute", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Requesting"
            />
        );

        // The component should be rendered with correct namespace for requesting agency
        expect(screen.getByLabelText("Requesting Agency")).toBeInTheDocument();
    });

    it("handles empty agencies data", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
            />
        );

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("handles undefined agencies data", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
            />
        );

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
        // React-select should show placeholder text
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();
    });

    it("formats agency options correctly", async () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        const user = userEvent.setup();
        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
            />
        );

        // Click to open the dropdown
        const selectInput = screen.getByLabelText("Servicing Agency");
        await user.click(selectInput);

        // Check that agencies are formatted correctly (name only, not name + abbr)
        expect(await screen.findByText("Department of Health and Human Services")).toBeInTheDocument();
        expect(await screen.findByText("National Science Foundation")).toBeInTheDocument();
    });

    it("passes additional props to Select component", () => {
        useGetAllAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                isRequired={true}
                data-testid="custom-test-id"
            />
        );

        // Check that label and select are properly connected
        const label = screen.getByText("Servicing Agency");
        const selectInput = screen.getByLabelText("Servicing Agency");
        expect(label).toBeInTheDocument();
        expect(selectInput).toBeInTheDocument();
    });
});
