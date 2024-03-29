import { screen, render } from "@testing-library/react";
import { vi } from "vitest";
import { ProcurementShopSelectWithFee } from "./ProcurementShopSelectWithFee";
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
            <ProcurementShopSelectWithFee
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ error: true });
        render(
            <ProcurementShopSelectWithFee
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );
        expect(screen.getByText("Oops, an error occurred")).toBeInTheDocument();
    });

    it("renders initial state with no shop selected", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        render(
            <ProcurementShopSelectWithFee
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
            <ProcurementShopSelectWithFee
                selectedProcurementShop={null}
                onChangeSelectedProcurementShop={mockFn}
            />
        );

        for (const shop of sampleShops) {
            const fullShopName = `${shop.name} (${shop.abbr})`;
            const option = await screen.findByText(fullShopName);
            expect(option).toBeInTheDocument();
        }
    });
});
