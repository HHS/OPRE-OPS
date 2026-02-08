import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AgreementNameComboBox from "./AgreementNameComboBox";
import { useGetAllAgreements } from "../../../hooks/useGetAllAgreements";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { MemoryRouter, useNavigate } from "react-router-dom";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("../../../hooks/useGetAllAgreements");
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: vi.fn()
    };
});

const sampleAgreements = [
    { id: 1, display_name: "Contract #001" },
    { id: 2, display_name: "Grant ABC" },
    { id: 3, display_name: "Contract #002" }
];

describe("AgreementNameComboBox", () => {
    const mockSetSelectedAgreementNames = mockFn;

    it("renders the component with the correct label", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Contract #001")).toBeInTheDocument();
        expect(screen.getByText("Grant ABC")).toBeInTheDocument();
        expect(screen.getByText("Contract #002")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Contract #001" } });
        expect(input).toHaveValue("Contract #001");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedAgreementNames = mockFn;
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        const { getByText, container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={setSelectedAgreementNames}
                />
            </MemoryRouter>
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Contract #001"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Grant ABC"));
        expect(setSelectedAgreementNames).toHaveBeenCalledWith([
            { id: 1, display_name: "Contract #001", title: "Contract #001" },
            { id: 2, display_name: "Grant ABC", title: "Grant ABC" }
        ]);
    });

    it("removes duplicate agreement names", () => {
        const duplicateAgreements = [
            { id: 1, display_name: "Contract #001" },
            { id: 2, display_name: "Contract #001" },
            { id: 3, display_name: "Grant ABC" }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: duplicateAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // Should only show "Contract #001" once
        const options = screen.getAllByText("Contract #001");
        expect(options).toHaveLength(1);
    });

    it("displays loading state while fetching agreements", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: true,
            isError: false,
            error: null
        });

        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("navigates to error page when there is an error", async () => {
        const mockNavigate = vi.fn();
        useNavigate.mockReturnValue(mockNavigate);

        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: false,
            isError: true,
            error: { message: "Failed to fetch" }
        });

        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("renders with custom legend class name", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                    legendClassname="custom-legend-class"
                />
            </MemoryRouter>
        );

        const label = screen.getByText("Agreement Title");
        expect(label).toHaveClass("custom-legend-class");
    });

    it("renders with custom default string", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: sampleAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                    defaultString="Select an Agreement"
                />
            </MemoryRouter>
        );

        expect(screen.getByText("Select an Agreement")).toBeInTheDocument();
    });

    it("handles agreements with null or undefined display_name", () => {
        const agreementsWithNull = [
            { id: 1, display_name: "Contract #001" },
            { id: 2, display_name: null },
            { id: 3, display_name: undefined },
            { id: 4, display_name: "Grant ABC" }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: agreementsWithNull,
            isLoading: false,
            isError: false,
            error: null
        });

        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // Should only show agreements with valid display_name
        expect(screen.getByText("Contract #001")).toBeInTheDocument();
        expect(screen.getByText("Grant ABC")).toBeInTheDocument();
        expect(screen.queryByText("null")).not.toBeInTheDocument();
        expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    });

    it("sorts agreement names alphabetically", () => {
        const unsortedAgreements = [
            { id: 1, display_name: "Zebra Agreement" },
            { id: 2, display_name: "Alpha Contract" },
            { id: 3, display_name: "Beta Grant" }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: unsortedAgreements,
            isLoading: false,
            isError: false,
            error: null
        });

        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        const options = screen.getAllByRole("option");
        const optionTexts = options.map((opt) => opt.textContent);

        // Should be sorted alphabetically
        expect(optionTexts[0]).toBe("Alpha Contract");
        expect(optionTexts[1]).toBe("Beta Grant");
        expect(optionTexts[2]).toBe("Zebra Agreement");
    });

    it("handles empty agreements list", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: false,
            isError: false,
            error: null
        });

        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles undefined agreements", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: null,
            isLoading: false,
            isError: false,
            error: null
        });

        render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={null}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                />
            </MemoryRouter>
        );

        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
});
