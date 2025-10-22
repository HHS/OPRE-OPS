import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import { useGetAgreementAgenciesQuery } from "../../../api/opsAPI";
import { renderWithProviders } from "../../../test-utils";
import AgencySelect from "./AgencySelect";

vi.mock("../../../api/opsAPI");

const sampleAgencies = [
    { id: 1, name: "Department of Health and Human Services", abbreviation: "HHS", servicing: true, requesting: false },
    { id: 2, name: "Department of Education", abbreviation: "ED", servicing: false, requesting: true },
    { id: 3, name: "National Science Foundation", abbreviation: "NSF", servicing: true, requesting: true }
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
    });

    it("renders loading state", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        renderWithProviders(<AgencySelect {...defaultProps} />);

        expect(screen.getByText("Error loading agencies")).toBeInTheDocument();
    });

    it("renders Select component with agencies for Servicing type", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Servicing" />);

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
        expect(screen.getByText("Department of Health and Human Services (HHS)")).toBeInTheDocument();
        expect(screen.getByText("National Science Foundation (NSF)")).toBeInTheDocument();
    });

    it("renders Select component with agencies for Requesting type", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Requesting" />);

        expect(screen.getByLabelText("Requesting Agency")).toBeInTheDocument();
        expect(screen.getByText("Department of Education (ED)")).toBeInTheDocument();
        expect(screen.getByText("National Science Foundation (NSF)")).toBeInTheDocument();
    });

    it("calls useGetAgreementAgenciesQuery with correct parameters for Servicing", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Servicing" />);

        expect(useGetAgreementAgenciesQuery).toHaveBeenCalledWith({ servicing: true });
    });

    it("calls useGetAgreementAgenciesQuery with correct parameters for Requesting", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Requesting" />);

        expect(useGetAgreementAgenciesQuery).toHaveBeenCalledWith({ requesting: true });
    });

    it("passes onChange handler to Select component", async () => {
        const mockOnChange = vi.fn();
        useGetAgreementAgenciesQuery.mockReturnValue({
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
            />
        );

        const select = screen.getByLabelText("Servicing Agency");
        await user.selectOptions(select, "1");

        expect(mockOnChange).toHaveBeenCalledWith("servicing-agency", "1");
    });

    it("displays selected value correctly", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(
            <AgencySelect
                {...defaultProps}
                agencyType="Servicing"
                value="1"
            />
        );

        const select = screen.getByLabelText("Servicing Agency");
        expect(select.value).toBe("1");
    });

    it("passes error messages to Select component", () => {
        const errorMessages = ["This field is required"];
        useGetAgreementAgenciesQuery.mockReturnValue({
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
        useGetAgreementAgenciesQuery.mockReturnValue({
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

        expect(screen.getByTestId("select-fieldset")).toHaveClass("custom-class");
    });

    it("generates correct select name attribute", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Requesting" />);

        const select = screen.getByLabelText("Requesting Agency");
        expect(select).toHaveAttribute("name", "requesting-agency");
    });

    it("handles empty agencies data", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Servicing" />);

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
        // Should have the default option plus the Select component's default options
        const options = screen.getAllByRole("option");
        expect(options[0]).toHaveTextContent("-Select an option-");
    });

    it("handles undefined agencies data", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Servicing" />);

        expect(screen.getByLabelText("Servicing Agency")).toBeInTheDocument();
        // Should have the default option plus the Select component's default options
        const options = screen.getAllByRole("option");
        expect(options[0]).toHaveTextContent("-Select an option-");
    });

    it("formats agency options correctly", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
            data: sampleAgencies,
            isLoading: false,
            isError: false
        });

        renderWithProviders(<AgencySelect {...defaultProps} agencyType="Servicing" />);

        // Check that agencies are formatted as "Name (Abbreviation)"
        expect(screen.getByText("Department of Health and Human Services (HHS)")).toBeInTheDocument();
        expect(screen.getByText("National Science Foundation (NSF)")).toBeInTheDocument();
    });

    it("passes additional props to Select component", () => {
        useGetAgreementAgenciesQuery.mockReturnValue({
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

        const select = screen.getByLabelText("Servicing Agency");
        expect(select).toHaveAttribute("required");
    });
});
