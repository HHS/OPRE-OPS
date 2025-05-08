import { render, fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import PortfoliosComboBox from "./PortfoliosComboBox";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("../../../api/opsAPI");

const samplePortfolios = [
    { id: 1, name: "Portfolio1" },
    { id: 2, name: "Portfolio2" },
    { id: 3, name: "Portfolio3" }
];

describe("PortfoliosComboBox", () => {
    const mockSetSelectedPortfolios = mockFn;

    it("renders the component with the correct label", () => {
        useGetPortfoliosQuery.mockReturnValue({ data: samplePortfolios });
        render(
            <PortfoliosComboBox
                selectedPortfolios={null}
                setSelectedPortfolios={mockSetSelectedPortfolios}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        useGetPortfoliosQuery.mockReturnValue({ data: samplePortfolios, isSuccess: true });
        const { container } = render(
            <PortfoliosComboBox
                selectedPortfolios={null}
                setSelectedPortfolios={mockSetSelectedPortfolios}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Portfolio1")).toBeInTheDocument();
        expect(screen.getByText("Portfolio2")).toBeInTheDocument();
        expect(screen.getByText("Portfolio3")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        useGetPortfoliosQuery.mockReturnValue({ data: samplePortfolios });
        render(
            <PortfoliosComboBox
                selectedPortfolios={null}
                setSelectedPortfolios={mockSetSelectedPortfolios}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Portfolio1" } });
        expect(input).toHaveValue("Portfolio1");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedPortfolios = mockFn;
        useGetPortfoliosQuery.mockReturnValue({ data: samplePortfolios, isSuccess: true });
        const { getByText, container } = render(
            <PortfoliosComboBox
                selectedPortfolios={null}
                setSelectedPortfolios={setSelectedPortfolios}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Portfolio1"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Portfolio2"));
        expect(setSelectedPortfolios).toHaveBeenCalledWith([
            { id: 1, name: "Portfolio1", title: "Portfolio1" },
            { id: 2, name: "Portfolio2", title: "Portfolio2" }
        ]);
    });
});
