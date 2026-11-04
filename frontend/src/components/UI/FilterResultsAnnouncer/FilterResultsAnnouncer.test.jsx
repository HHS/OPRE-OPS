import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FilterResultsAnnouncer from "./FilterResultsAnnouncer";
import { countFilterValues, describeFilterChange } from "./FilterResultsAnnouncer.helpers";

const noFilters = { portfolio: [], division: [], budgetRange: null };
const oneFilter = { portfolio: [{ id: 1 }], division: [], budgetRange: null };
const twoFilters = { portfolio: [{ id: 1 }], division: [{ id: 2 }], budgetRange: null };

const renderAnnouncer = (props) =>
    render(
        <FilterResultsAnnouncer
            itemName="agreement"
            itemNamePlural="agreements"
            {...props}
        />
    );

describe("FilterResultsAnnouncer", () => {
    it("is a polite status region that says nothing on first render", () => {
        renderAnnouncer({ filters: oneFilter, resultCount: 5, isFetching: false });

        const region = screen.getByRole("status");
        expect(region).toHaveAttribute("aria-live", "polite");
        expect(region).toBeEmptyDOMElement();
    });

    it("waits for the new results, then announces the change and the new count", () => {
        const { rerender } = renderAnnouncer({ filters: noFilters, resultCount: 40, isFetching: false });

        rerender(
            <FilterResultsAnnouncer
                filters={twoFilters}
                resultCount={40}
                isFetching={true}
                itemName="agreement"
                itemNamePlural="agreements"
            />
        );
        expect(screen.getByRole("status")).toBeEmptyDOMElement();

        rerender(
            <FilterResultsAnnouncer
                filters={twoFilters}
                resultCount={12}
                isFetching={false}
                itemName="agreement"
                itemNamePlural="agreements"
            />
        );
        expect(screen.getByRole("status")).toHaveTextContent("Filters applied. 12 agreements.");
    });

    it("announces a removed filter with a singular result", () => {
        const { rerender } = renderAnnouncer({ filters: twoFilters, resultCount: 3, isFetching: false });

        rerender(
            <FilterResultsAnnouncer
                filters={oneFilter}
                resultCount={1}
                isFetching={false}
                itemName="agreement"
                itemNamePlural="agreements"
            />
        );
        expect(screen.getByRole("status")).toHaveTextContent("Filter removed. 1 agreement.");
    });

    it("announces cleared filters", () => {
        const { rerender } = renderAnnouncer({ filters: oneFilter, resultCount: 3, isFetching: false });

        rerender(
            <FilterResultsAnnouncer
                filters={noFilters}
                resultCount={40}
                isFetching={false}
                itemName="agreement"
                itemNamePlural="agreements"
            />
        );
        expect(screen.getByRole("status")).toHaveTextContent("Filters cleared. 40 agreements.");
    });

    it("does not announce when only the results change", () => {
        const { rerender } = renderAnnouncer({ filters: oneFilter, resultCount: 3, isFetching: false });

        rerender(
            <FilterResultsAnnouncer
                filters={oneFilter}
                resultCount={4}
                isFetching={false}
                itemName="agreement"
                itemNamePlural="agreements"
            />
        );
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });
});

describe("countFilterValues", () => {
    it("counts array items and other set values, ignoring null and undefined", () => {
        expect(countFilterValues({ a: [1, 2], b: null, c: undefined, d: [100, 500], e: [] })).toBe(4);
        expect(countFilterValues(undefined)).toBe(0);
    });
});

describe("describeFilterChange", () => {
    it("describes applied, removed and cleared filters", () => {
        expect(describeFilterChange(0, 2)).toBe("Filters applied.");
        expect(describeFilterChange(2, 2)).toBe("Filters applied.");
        expect(describeFilterChange(2, 1)).toBe("Filter removed.");
        expect(describeFilterChange(2, 0)).toBe("Filters cleared.");
    });
});
