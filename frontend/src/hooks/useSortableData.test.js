import { render, act } from "@testing-library/react";
import useSortableData, { useSortData, SORT_TYPES } from "./use-sortable-data.hooks";
import { tableSortCodes } from "../helpers/utils";
const TestComponent = ({ items, config, onHookResult }) => {
    const hookResult = useSortableData(items, config);
    onHookResult(hookResult);
    return null;
};

const renderTestComponent = (items, config, onHookResult) => {
    render(
        <TestComponent
            items={items}
            config={config}
            onHookResult={onHookResult}
        />
    );
};

describe("useSortableData", () => {
    const items = [
        { id: 1, name: "John", age: 28 },
        { id: 2, name: "Jane", age: 30 },
        { id: 3, name: "Bob", age: 20 }
    ];

    test("should return unsorted items when config is null", () => {
        let hookResult;
        renderTestComponent(items, null, (result) => {
            hookResult = result;
        });

        expect(hookResult.items).toEqual(items);
    });

    test("should update sortConfig when requestSort is called", () => {
        let hookResult;
        renderTestComponent(items, null, (result) => {
            hookResult = result;
        });

        act(() => {
            hookResult.requestSort("name");
        });

        expect(hookResult.sortConfig).toEqual({ key: "name", direction: "ascending" });

        act(() => {
            hookResult.requestSort("name");
        });

        expect(hookResult.sortConfig).toEqual({ key: "name", direction: "descending" });
    });

    test("should sort items by name in ascending order", () => {
        let hookResult;
        renderTestComponent(items, null, (result) => {
            hookResult = result;
        });

        act(() => {
            hookResult.requestSort("name");
        });

        expect(hookResult.items).toEqual([
            { id: 3, name: "Bob", age: 20 },
            { id: 2, name: "Jane", age: 30 },
            { id: 1, name: "John", age: 28 }
        ]);
    });

    test("should sort items by name in descending order", () => {
        let hookResult;
        renderTestComponent(items, null, (result) => {
            hookResult = result;
        });

        act(() => {
            hookResult.requestSort("name");
        });

        act(() => {
            hookResult.requestSort("name");
        });

        expect(hookResult.items).toEqual([
            { id: 1, name: "John", age: 28 },
            { id: 2, name: "Jane", age: 30 },
            { id: 3, name: "Bob", age: 20 }
        ]);
    });
});

describe("useSortData BLIDiff Sort", () => {
    const bli_list = [
        {
            id: 15000,
            agreement_name: "A Agreement",
            services_component: 1,
            date_needed: "2046-03-15T10:00:00Z",
            fiscal_year: 2046,
            can: { display_name: "G99ABCD" },
            amount: 200,
            proc_shop_fee_percentage: 0.5,
            status: "PLANNED",
            created_on: "2023-03-15T10:00:00Z"
        },
        {
            id: 15001,
            agreement_name: "C Agreement",
            services_component: 2,
            date_needed: "2044-04-15T10:00:00Z",
            fiscal_year: 2044,
            can: { display_name: "G99HIJK" },
            amount: 300,
            proc_shop_fee_percentage: 0.5,
            status: "OBLIGATED",
            created_on: "2023-03-15T10:00:00Z"
        },
        {
            id: 15002,
            agreement_name: "B Agreement",
            services_component: 1,
            date_needed: "2045-03-15T10:00:00Z",
            fiscal_year: 2045,
            canDisplayName: "G99DEFG",
            amount: 400,
            proc_shop_fee_percentage: 0.5,
            status: "IN_EXECUTION"
        }
    ];
    // Need to test BLI Diff, BLI Review, BudgetLines, CANBudgetLine

    test("sort by bl id #", () => {
        let sortedData = useSortData(bli_list, true, tableSortCodes.budgetLineCodes.BL_ID_NUMBER, SORT_TYPES.BLI_DIFF);

        expect(sortedData).toEqual([
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            }
        ]);

        sortedData = useSortData(bli_list, false, tableSortCodes.budgetLineCodes.BL_ID_NUMBER, SORT_TYPES.BLI_REVIEW);

        expect(sortedData).toEqual([
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            },
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by obligate by date", () => {
        let sortedData = useSortData(
            bli_list,
            true,
            tableSortCodes.budgetLineCodes.OBLIGATE_BY,
            SORT_TYPES.BUDGET_LINES
        );

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            },
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);

        sortedData = useSortData(bli_list, false, tableSortCodes.budgetLineCodes.OBLIGATE_BY, SORT_TYPES.CAN_BLI);

        expect(sortedData).toEqual([
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            },
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by fiscal year", () => {
        let sortedData = useSortData(bli_list, true, tableSortCodes.budgetLineCodes.FISCAL_YEAR, SORT_TYPES.CAN_BLI);

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            },
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by can id", () => {
        let sortedData = useSortData(bli_list, false, tableSortCodes.budgetLineCodes.CAN_NUMBER, SORT_TYPES.BLI_DIFF);

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.5,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            },
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.5,
                status: "IN_EXECUTION"
            },
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.5,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by amount", () => {
        // TODO: Implement sort by amount test
        expect(true).toBe(true);
    });

    test("sort by fee", () => {
        // TODO: Implement sort by fee test
        expect(true).toBe(true);
    });

    test("sort by total", () => {
        // TODO: Implement sort by total test
        expect(true).toBe(true);
    });

    test("sort by status", () => {
        // TODO: Implement sort by status test
        expect(true).toBe(true);
    });
});

describe("useSortData CLIN Sort", () => {
    // A: backend CLIN 10, B: backend CLIN 2, C: no CLIN (draft),
    // D: backend CLIN 5 but a local (unsaved) assignment of 1 that should win.
    const bli_list = [
        { id: 1, status: "PLANNED", clin: { number: 10 } },
        { id: 2, status: "PLANNED", clin: { number: 2 } },
        { id: 3, status: "DRAFT", clin: null },
        { id: 4, status: "PLANNED", clin: { number: 5 } }
    ];
    const sortContext = { clinAssignments: { 4: 1 } };

    test("sorts numerically ascending, prefers local assignment, missing CLIN last", () => {
        const sortedIds = useSortData(
            bli_list,
            false,
            tableSortCodes.budgetLineCodes.CLIN,
            SORT_TYPES.BLI_REVIEW,
            sortContext
        ).map((bli) => bli.id);

        // D(assigned 1), B(2), A(10), then C(no CLIN) pinned last
        expect(sortedIds).toEqual([4, 2, 1, 3]);
    });

    test("sorts numerically descending but keeps missing CLIN last", () => {
        const sortedIds = useSortData(
            bli_list,
            true,
            tableSortCodes.budgetLineCodes.CLIN,
            SORT_TYPES.BLI_REVIEW,
            sortContext
        ).map((bli) => bli.id);

        // A(10), B(2), D(assigned 1), then C(no CLIN) still pinned last
        expect(sortedIds).toEqual([1, 2, 4, 3]);
    });

    test("falls back to backend clin.number when no local assignments are provided", () => {
        const sortedIds = useSortData(bli_list, false, tableSortCodes.budgetLineCodes.CLIN, SORT_TYPES.BLI_REVIEW).map(
            (bli) => bli.id
        );

        // Without assignments: B(2), D(5), A(10), then C(no CLIN) last
        expect(sortedIds).toEqual([2, 4, 1, 3]);
    });

    test("pins Draft rows last even when they carry a stale backend clin.number", () => {
        // E is a Draft row with a leftover backend CLIN of 1. The row displays "N/A", so it must
        // sort to the end alongside other CLIN-less rows rather than by that stale number.
        const listWithStaleDraft = [
            { id: 1, status: "PLANNED", clin: { number: 10 } },
            { id: 2, status: "PLANNED", clin: { number: 2 } },
            { id: 3, status: "DRAFT", clin: null },
            { id: 5, status: "DRAFT", clin: { number: 1 } }
        ];

        const sortedIds = useSortData(
            listWithStaleDraft,
            false,
            tableSortCodes.budgetLineCodes.CLIN,
            SORT_TYPES.BLI_REVIEW
        ).map((bli) => bli.id);

        // B(2), A(10), then the two Draft rows pinned last (their relative order is preserved).
        expect(sortedIds).toEqual([2, 1, 3, 5]);
    });
});
