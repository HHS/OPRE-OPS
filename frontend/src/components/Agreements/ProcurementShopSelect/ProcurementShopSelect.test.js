import { screen, render, fireEvent } from "@testing-library/react";
import { expect, vi } from "vitest";
import { ProcurementShopSelect } from "./ProcurementShopSelect";
import { useGetProcurementShopsQuery } from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("../../../api/opsAPI");

const sampleShops = [
    { id: 1, name: "Shop1", abbr: "S1", fee: 0.1 },
    { id: 2, name: "Shop2", abbr: "S2", fee: 0.2 }
];

describe("ProcurementShopSelect", () => {
    it("renders loading state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ isLoading: true });
        render(
            <ProcurementShopSelect
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ error: true });
        render(
            <ProcurementShopSelect
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(screen.getByText("Oops, an error occurred")).toBeInTheDocument();
    });

    it("renders initial state with no shop selected", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        render(
            <ProcurementShopSelect
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );
        const select = screen.getByLabelText("Procurement Shop");

        expect(select.value).toBe("0");
    });

    it("displays all shops in the dropdown", async () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        render(
            <ProcurementShopSelect
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

    it("displays error message when shop is not GCS", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        render(
            <ProcurementShopSelect
                selectedProcurementShop={sampleShops[1]}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        fireEvent.change(screen.getByLabelText("Procurement Shop"), { target: { value: sampleShops[0].id } });

        expect(screen.getByText("GCS is the only available type for now")).toBeInTheDocument();
    });

    it("does not display error message when shop is GCS", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        render(
            <ProcurementShopSelect
                selectedProcurementShop={sampleShops[2]}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        expect(screen.queryByText("GCS is the only available type for now")).not.toBeInTheDocument();
    });
});
