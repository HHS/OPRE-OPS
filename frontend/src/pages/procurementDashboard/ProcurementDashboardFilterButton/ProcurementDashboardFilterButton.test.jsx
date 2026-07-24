import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProcurementDashboardFilterButton from "./ProcurementDashboardFilterButton";

// Mocks the shared FilterComboBox as a native multi-select, keyed by namespace so the
// two instances (proc shop / division) render distinct testids and labels.
vi.mock("../../../components/UI/Form/FilterComboBox", () => ({
    default: ({ label, namespace, options, selected, setSelected, optionText }) => (
        <div data-testid={namespace}>
            <label htmlFor={`${namespace}-select`}>{label}</label>
            <select
                id={`${namespace}-select`}
                multiple
                value={selected.map((item) => String(item.id))}
                onChange={(e) => {
                    const chosen = Array.from(e.target.selectedOptions);
                    setSelected(chosen.map((opt) => options.find((item) => String(item.id) === opt.value)));
                }}
            >
                {options.map((item) => (
                    <option
                        key={item.id}
                        value={item.id}
                    >
                        {optionText(item)}
                    </option>
                ))}
            </select>
            {/* Simulates the shared ComboBox reporting a cleared multi-select as null. */}
            <button
                type="button"
                data-testid={`${namespace}-clear`}
                onClick={() => setSelected(null)}
            >
                clear
            </button>
        </div>
    )
}));

vi.mock("react-modal", () => {
    const Modal = ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
    Modal.setAppElement = vi.fn();
    return { default: Modal };
});

describe("ProcurementDashboardFilterButton", () => {
    const mockSetFilters = vi.fn();
    const defaultFilters = { procShop: [], division: [] };
    const procShopOptions = [
        { id: 1, abbr: "GCS" },
        { id: 2, abbr: "PSC" }
    ];
    const divisionOptions = [
        { id: 1, name: "Division A" },
        { id: 2, name: "Division B" }
    ];

    beforeEach(() => {
        mockSetFilters.mockClear();
    });

    const renderButton = (filters = defaultFilters) =>
        render(
            <ProcurementDashboardFilterButton
                filters={filters}
                setFilters={mockSetFilters}
                procShopOptions={procShopOptions}
                divisionOptions={divisionOptions}
            />
        );

    it("renders the filter button", () => {
        renderButton();
        expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("opens the modal with proc shop and division fieldsets", async () => {
        const user = userEvent.setup();
        renderButton();

        await user.click(screen.getByText("Filters"));

        expect(await screen.findByTestId("modal")).toBeInTheDocument();
        expect(screen.getByTestId("proc-shop-combobox")).toBeInTheDocument();
        expect(screen.getByTestId("division-combobox")).toBeInTheDocument();
    });

    it("commits selected proc shop and division on Apply", async () => {
        const user = userEvent.setup();
        renderButton();

        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText("Procurement Shop"), "1");
        await user.selectOptions(screen.getByLabelText("Division"), "2");
        await user.click(screen.getByRole("button", { name: /apply/i }));

        expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
        const result = mockSetFilters.mock.calls.at(-1)[0](defaultFilters);
        expect(result.procShop).toEqual([{ id: 1, abbr: "GCS" }]);
        expect(result.division).toEqual([{ id: 2, name: "Division B" }]);
    });

    it("clears both filters on Reset", async () => {
        const user = userEvent.setup();
        renderButton({ procShop: [procShopOptions[0]], division: [divisionOptions[0]] });

        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /reset/i }));

        expect(mockSetFilters).toHaveBeenCalledWith({ procShop: [], division: [] });
    });

    it("closes the modal on Apply", async () => {
        const user = userEvent.setup();
        renderButton();

        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /apply/i }));

        await waitFor(() => {
            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });
    });

    it("commits an empty array (not null) when a multi-select is cleared then applied", async () => {
        const user = userEvent.setup();
        renderButton({ procShop: [procShopOptions[0]], division: [] });

        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();

        // Simulate the shared ComboBox reporting a cleared multi-select as null.
        await user.click(screen.getByTestId("proc-shop-combobox-clear"));
        await user.click(screen.getByRole("button", { name: /apply/i }));

        const result = mockSetFilters.mock.calls.at(-1)[0]({ procShop: [procShopOptions[0]], division: [] });
        expect(result.procShop).toEqual([]);
        expect(result.division).toEqual([]);
    });

    it("re-seeds buffers from committed filters when the modal reopens, discarding un-applied edits", async () => {
        const user = userEvent.setup();
        renderButton();

        // Open, select a proc shop, then close WITHOUT applying.
        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();
        await user.selectOptions(screen.getByLabelText("Procurement Shop"), "1");
        expect(screen.getByLabelText("Procurement Shop")).toHaveValue(["1"]);
        await user.click(screen.getByRole("button", { name: /^filters$/i }));
        await waitFor(() => expect(screen.queryByTestId("modal")).not.toBeInTheDocument());

        // Reopen: the un-applied selection is discarded (buffer re-seeded from committed filters).
        await user.click(screen.getByText("Filters"));
        expect(await screen.findByTestId("modal")).toBeInTheDocument();
        expect(screen.getByLabelText("Procurement Shop")).toHaveValue([]);
    });
});
