import { screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import { useGetProcurementShopsQuery } from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { renderWithProviders } from "../../../test-utils";
import ProcurementShopSelect from "./ProcurementShopSelect";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("../../../api/opsAPI");

const sampleShops = [
    { id: 1, name: "Shop1", abbr: "S1", fee: 0.1 },
    { id: 2, name: "Shop2", abbr: "S2", fee: 0.2 }
];

describe("ProcurementShopSelect", () => {
    it("renders loading state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ isLoading: true });
        renderWithProviders(
            <ProcurementShopSelect
                name="procurement-shop"
                label="Procurement Shop"
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ error: true });
        renderWithProviders(
            <ProcurementShopSelect
                name="procurement-shop"
                label="Procurement Shop"
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(
            screen.getByText("This is a non-production OPS environment for testing purposes only")
        ).toBeInTheDocument();
    });

    it("renders initial state with no shop selected", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        renderWithProviders(
            <ProcurementShopSelect
                name="procurement-shop"
                label="Procurement Shop"
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );
        const select = screen.getByLabelText("Procurement Shop");

        expect(select.value).toBe("0");
    });

    it("displays all shops in the dropdown", async () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        renderWithProviders(
            <ProcurementShopSelect
                name="procurement-shop"
                label="Procurement Shop"
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        for (const shop of sampleShops) {
            const fullShopName = `${shop.name} (${shop.abbr})`;
            const option = await screen.findByText(fullShopName);

            expect(option).toBeInTheDocument();
        }
        expect(screen.getAllByRole("option")).toHaveLength(sampleShops.length + 1);
    });

    it("does not display error message when shop is GCS", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        renderWithProviders(
            <ProcurementShopSelect
                name="procurement-shop"
                label="Procurement Shop"
                selectedProcurementShop={sampleShops[1]}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(screen.queryByText("GCS is the only available type for now")).not.toBeInTheDocument();
    });
});
