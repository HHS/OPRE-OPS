import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Provider } from "react-redux";
import store from "../../../store";
import FiscalYear from "./FiscalYear";

describe("FiscalYear Component", () => {
    it("renders without crashing", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                />
            </Provider>
        );
        // Verify the component renders without throwing
        expect(document.body).toBeInTheDocument();
    });

    it("displays the selected fiscal year", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                />
            </Provider>
        );

        const select = screen.getByRole("combobox");
        expect(select).toHaveValue("2024");
    });

    it("does not display 'All' option by default", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                />
            </Provider>
        );

        const allOption = screen.queryByRole("option", { name: "All" });
        expect(allOption).not.toBeInTheDocument();
    });

    it("displays 'All' option when showAllOption is true", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                    showAllOption={true}
                />
            </Provider>
        );

        const allOption = screen.getByRole("option", { name: "All" });
        expect(allOption).toBeInTheDocument();
    });

    it("uses provided fiscalYears prop for options", () => {
        const customYears = [2023, 2024, 2025];

        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                    fiscalYears={customYears}
                />
            </Provider>
        );

        expect(screen.getByRole("option", { name: "2023" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "2024" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "2025" })).toBeInTheDocument();
    });

    it("falls back to constants.fiscalYears when fiscalYears prop is empty", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                    fiscalYears={[]}
                />
            </Provider>
        );

        // Should fallback to constants.fiscalYears (which includes multiple years)
        const options = screen.getAllByRole("option");
        // Constants should have multiple years
        expect(options.length).toBeGreaterThan(1);
    });

    it("falls back to constants.fiscalYears when fiscalYears prop is not provided", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                />
            </Provider>
        );

        // Should fallback to constants.fiscalYears
        const options = screen.getAllByRole("option");
        // Constants should have multiple years
        expect(options.length).toBeGreaterThan(1);
    });

    it("displays 'Multi' option when fiscalYear is 'Multi'", () => {
        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear="Multi"
                    handleChangeFiscalYear={() => {}}
                />
            </Provider>
        );

        const multiOption = screen.getByRole("option", { name: "Multi" });
        expect(multiOption).toBeInTheDocument();
    });

    it("places 'All' option at the bottom when showAllOption is true", () => {
        const customYears = [2023, 2024, 2025];

        render(
            <Provider store={store}>
                <FiscalYear
                    fiscalYear={2024}
                    handleChangeFiscalYear={() => {}}
                    fiscalYears={customYears}
                    showAllOption={true}
                />
            </Provider>
        );

        const options = screen.getAllByRole("option");
        const lastOption = options[options.length - 1];

        expect(lastOption).toHaveValue("All");
        expect(lastOption).toHaveTextContent("All");
    });
});
