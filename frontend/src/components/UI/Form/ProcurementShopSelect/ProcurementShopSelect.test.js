import { render } from "@testing-library/react";
import { ProcurementShopSelect } from "./ProcurementShopSelect";
import { useGetProcurementShopsQuery } from "../../../../api/opsAPI";

jest.mock("../../../../api/opsAPI");

const sampleShops = [
    { id: 1, name: "Shop1", abbr: "S1", fee: 0.1 },
    { id: 2, name: "Shop2", abbr: "S2", fee: 0.2 },
];

describe("ProcurementShopSelect", () => {
    it("renders loading state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ isLoading: true });
        const { getByText } = render(
            <ProcurementShopSelect selectedProcurementShop={null} onChangeSelectedProcurementShop={jest.fn()} />
        );
        expect(getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetProcurementShopsQuery.mockReturnValue({ error: true });
        const { getByText } = render(
            <ProcurementShopSelect selectedProcurementShop={null} onChangeSelectedProcurementShop={jest.fn()} />
        );
        expect(getByText("Oops, an error occurred")).toBeInTheDocument();
    });

    it("renders initial state with no shop selected", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        const { getByLabelText } = render(
            <ProcurementShopSelect selectedProcurementShop={null} onChangeSelectedProcurementShop={jest.fn()} />
        );
        const select = getByLabelText("Procurement Shop");
        expect(select.value).toBe("0");
    });

    it("displays all shops in the dropdown", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        const { getByLabelText, getByTestId } = render(
            <ProcurementShopSelect selectedProcurementShop={null} onChangeSelectedProcurementShop={jest.fn()} />
        );
        const select = getByLabelText("Procurement Shop");

        sampleShops.forEach((shop) => {
            const option = Array.from(select.querySelectorAll("option")).find((optionElement) => {
                const regexpName = new RegExp(shop.name, "i");
                const regexpCode = new RegExp(shop.abbr, "i");
                return regexpName.test(optionElement.textContent) && regexpCode.test(optionElement.textContent);
            });
            expect(option).toBeInTheDocument();
        });
    });

    it("sets default selected shop if provided", () => {
        useGetProcurementShopsQuery.mockReturnValue({ data: sampleShops });
        const selectedShop = sampleShops[1];
        const { getByLabelText } = render(
            <ProcurementShopSelect selectedProcurementShop={selectedShop} onChangeSelectedProcurementShop={jest.fn()} />
        );

        const select = getByLabelText("Procurement Shop");
        expect(select.value).toBe(selectedShop.id.toString());
    });
});
