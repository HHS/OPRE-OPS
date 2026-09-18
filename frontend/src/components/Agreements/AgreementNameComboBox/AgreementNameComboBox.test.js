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

// Each fixture sets name (full title) and nick_name — never display_name directly — matching
// what the backend actually sends (issue #6144: display_name is a computed nickname-preferred
// field, never an independent input). The nick_name values match the pre-#6144 fixture's
// `display_name` strings so most rendered-text assertions below are unaffected.
const sampleAgreements = [
    { id: 1, name: "Full Title For Contract 001", nick_name: "Contract #001" },
    { id: 2, name: "Full Title For Grant ABC", nick_name: "Grant ABC" },
    { id: 3, name: "Full Title For Contract 002", nick_name: "Contract #002" }
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
            {
                id: 1,
                title: "Contract #001",
                name: "Full Title For Contract 001",
                nick_name: "Contract #001",
                display_name: "Contract #001",
                searchText: "Full Title For Contract 001 Contract #001"
            },
            {
                id: 2,
                title: "Grant ABC",
                name: "Full Title For Grant ABC",
                nick_name: "Grant ABC",
                display_name: "Grant ABC",
                searchText: "Full Title For Grant ABC Grant ABC"
            }
        ]);
    });

    it("dedupes by agreement id, not by the rendered display string", () => {
        // Two agreements with the SAME id sharing a display string should collapse to one option.
        const trueDuplicateAgreements = [
            { id: 1, name: "Contract #001", nick_name: null },
            { id: 1, name: "Contract #001", nick_name: null },
            { id: 3, name: "Grant ABC", nick_name: null }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: trueDuplicateAgreements,
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

        // Should only show "Contract #001" once — same id twice collapses to one option.
        const options = screen.getAllByText("Contract #001");
        expect(options).toHaveLength(1);
    });

    it("does NOT drop an agreement when its display string collides with a different agreement's (trap 4 regression)", () => {
        // Agreement 1's nickname happens to equal agreement 2's full name. Keying the dedupe
        // Map by the rendered display string (the pre-fix behavior) would let id 2 silently
        // overwrite id 1's entry in the Map, making agreement 1 vanish from the dropdown with
        // no error. Keying by `id` (the fix) must keep both. Ref: issue #6144 trap 4.
        const collidingAgreements = [
            { id: 1, name: "A Very Different Full Title", nick_name: "Shared Label" },
            { id: 2, name: "Shared Label", nick_name: null }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: collidingAgreements,
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

        // Both agreement 1 (nickname "Shared Label") and agreement 2 (full name "Shared Label")
        // must still be present as two distinct options.
        const options = screen.getAllByText("Shared Label");
        expect(options).toHaveLength(2);
    });

    it("displays loading state while fetching agreements", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: true,
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

        expect(screen.getByTestId("combobox-loading-skeleton")).toBeInTheDocument();
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

    it("uses prefetched agreement name options when provided", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [{ id: 999, display_name: "Ignore Me" }],
            isLoading: false,
            isError: false,
            error: null
        });

        const prefetchedAgreementNames = [
            { id: 10, name: "Agreement Alpha" },
            { id: 11, name: "Agreement Beta" }
        ];

        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={[]}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                    agreementNameOptions={prefetchedAgreementNames}
                />
            </MemoryRouter>
        );

        expect(useGetAllAgreements).toHaveBeenCalledWith(
            {
                filters: {},
                onlyMy: false,
                sortConditions: "",
                sortDescending: false
            },
            { skip: true }
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Agreement Alpha")).toBeInTheDocument();
        expect(screen.getByText("Agreement Beta")).toBeInTheDocument();
        expect(screen.queryByText("Ignore Me")).not.toBeInTheDocument();
    });

    it("preserves display_name when selecting prefetched agreement name options", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: false,
            isError: false,
            error: null
        });

        const setSelectedAgreementNames = mockFn;
        const prefetchedAgreementNames = [{ id: 10, name: "MIHOPE Check-In" }];

        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={[]}
                    setSelectedAgreementNames={setSelectedAgreementNames}
                    agreementNameOptions={prefetchedAgreementNames}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        fireEvent.click(screen.getByText("MIHOPE Check-In"));

        expect(setSelectedAgreementNames).toHaveBeenCalledWith([
            {
                id: 10,
                name: "MIHOPE Check-In",
                nick_name: undefined,
                display_name: "MIHOPE Check-In",
                title: "MIHOPE Check-In",
                searchText: "MIHOPE Check-In"
            }
        ]);
    });

    it("renders a loading skeleton while prefetched options are still loading", () => {
        useGetAllAgreements.mockReturnValue({
            agreements: [],
            isLoading: false,
            isError: false,
            error: null
        });

        const { container } = render(
            <MemoryRouter>
                <AgreementNameComboBox
                    selectedAgreementNames={[]}
                    setSelectedAgreementNames={mockSetSelectedAgreementNames}
                    agreementNameOptions={[]}
                    isLoading={true}
                />
            </MemoryRouter>
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByTestId("combobox-loading-skeleton")).toBeInTheDocument();
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

    it("shows the nickname as the label when present, and the full name when absent", () => {
        const mixedAgreements = [
            { id: 1, name: "Full Title With Nickname", nick_name: "NICK" },
            { id: 2, name: "Full Title Without Nickname", nick_name: null }
        ];
        useGetAllAgreements.mockReturnValue({
            agreements: mixedAgreements,
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

        expect(screen.getByText("NICK")).toBeInTheDocument();
        expect(screen.getByText("Full Title Without Nickname")).toBeInTheDocument();
        expect(screen.queryByText("Full Title With Nickname")).not.toBeInTheDocument();
    });

    it("finds the option by typing the full name even though the nickname is the visible label", () => {
        const mixedAgreements = [{ id: 1, name: "MIHOPE Full Evaluation Title", nick_name: "MIHOPE" }];
        useGetAllAgreements.mockReturnValue({
            agreements: mixedAgreements,
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
        fireEvent.change(input, { target: { value: "Full Evaluation" } });

        expect(screen.getByText("MIHOPE")).toBeInTheDocument();
    });

    it("setSelectedAgreementNames receives {name, nick_name, title === display} for the derived-fetch path", () => {
        const setSelectedAgreementNames = mockFn;
        const mixedAgreements = [{ id: 1, name: "Full Title", nick_name: "NICK" }];
        useGetAllAgreements.mockReturnValue({
            agreements: mixedAgreements,
            isLoading: false,
            isError: false,
            error: null
        });
        const { container } = render(
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
        fireEvent.click(screen.getByText("NICK"));

        expect(setSelectedAgreementNames).toHaveBeenCalledWith([
            expect.objectContaining({
                id: 1,
                name: "Full Title",
                nick_name: "NICK",
                title: "NICK",
                display_name: "NICK"
            })
        ]);
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
