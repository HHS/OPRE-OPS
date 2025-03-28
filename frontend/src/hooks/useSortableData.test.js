import { render, act } from "@testing-library/react";
import useSortableData, { useSortData, SORT_TYPES } from "./use-sortable-data.hooks";
import { AGREEMENT_TABLE_HEADINGS } from "../components/Agreements/AgreementsTable/AgreementsTable.constants";
import { BLI_DIFF_TABLE_HEADERS } from "../components/BudgetLineItems/BLIDiffTable/BLIDiffTable.constants";
// import { BLI_REVIEW_HEADERS } from "../components/BudgetLineItems/BLIReviewTable/BLIReviewTable.constants";
// import { CAN_BLI_HEADERS } from "../components/CANs/CANBudgetLineTable/CANBudgetLineTable.constants";
// import { BUDGET_LINE_TABLE_HEADERS } from "../components/BudgetLineItems/BudgetLinesTable/BudgetLinesTable.constants";
import { BLI_STATUS } from "../helpers/budgetLines.helpers";
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

describe("useSortData agreement sort", () => {
    const agreements = [
        {
            id: 1,
            name: "Aardvark",
            project: { title: "car" },
            agreement_type: "contract",
            budget_line_items: [
                {
                    status: BLI_STATUS.PLANNED,
                    amount: 100,
                    date_needed: "2050-03-15T10:00:00Z",
                    proc_shop_fee_percentage: 0.005
                }
            ],
            procurement_shop: { fee: 0.005 }
        },
        {
            id: 2,
            name: "Banana",
            project: { title: "bunny" },
            agreement_type: "iaa",
            budget_line_items: [
                {
                    status: BLI_STATUS.PLANNED,
                    amount: 200,
                    date_needed: "2050-05-15T10:00:00Z",
                    proc_shop_fee_percentage: 0.005
                }
            ],
            procurement_shop: { fee: 0.005 }
        },
        {
            id: 3,
            name: "Car",
            project: { title: "animal" },
            agreement_type: "grant",
            budget_line_items: [
                {
                    status: BLI_STATUS.PLANNED,
                    amount: 300,
                    date_needed: "2050-04-15T10:00:00Z",
                    proc_shop_fee_percentage: 0.005
                }
            ],
            procurement_shop: { fee: 0.005 }
        }
    ];

    test("should sort agreement by name", () => {
        let sortedData = useSortData(agreements, true, AGREEMENT_TABLE_HEADINGS.AGREEMENT, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.AGREEMENT, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);
    });
    test("should sort agreement by project title", () => {
        let sortedData = useSortData(agreements, true, AGREEMENT_TABLE_HEADINGS.PROJECT, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.PROJECT, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);
    });

    test("should sort agreement by agreement type", () => {
        let sortedData = useSortData(agreements, true, AGREEMENT_TABLE_HEADINGS.TYPE, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.TYPE, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);
    });
    test("should sort agreement by agreement total", () => {
        let sortedData = useSortData(agreements, true, AGREEMENT_TABLE_HEADINGS.AGREEMENT_TOTAL, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.AGREEMENT_TOTAL, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);
    });
    test("should sort agreement by next budget line", () => {
        let sortedData = useSortData(
            agreements,
            true,
            AGREEMENT_TABLE_HEADINGS.NEXT_BUDGET_LINE,
            SORT_TYPES.AGREEMENTS
        );

        expect(sortedData).toEqual([
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.NEXT_BUDGET_LINE, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);
    });
    test("should sort agreement by next obligate by date", () => {
        let sortedData = useSortData(
            agreements,
            true,
            AGREEMENT_TABLE_HEADINGS.NEXT_OBLIGATE_BY,
            SORT_TYPES.AGREEMENTS
        );

        expect(sortedData).toEqual([
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
        ]);

        sortedData = useSortData(agreements, false, AGREEMENT_TABLE_HEADINGS.NEXT_OBLIGATE_BY, SORT_TYPES.AGREEMENTS);

        expect(sortedData).toEqual([
            {
                id: 1,
                name: "Aardvark",
                project: { title: "car" },
                agreement_type: "contract",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 100,
                        date_needed: "2050-03-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 3,
                name: "Car",
                project: { title: "animal" },
                agreement_type: "grant",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 300,
                        date_needed: "2050-04-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            },
            {
                id: 2,
                name: "Banana",
                project: { title: "bunny" },
                agreement_type: "iaa",
                budget_line_items: [
                    {
                        status: BLI_STATUS.PLANNED,
                        amount: 200,
                        date_needed: "2050-05-15T10:00:00Z",
                        proc_shop_fee_percentage: 0.005
                    }
                ],
                procurement_shop: { fee: 0.005 }
            }
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
            proc_shop_fee_percentage: 0.005,
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
            proc_shop_fee_percentage: 0.005,
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
            proc_shop_fee_percentage: 0.005,
            status: "IN_EXECUTION"
        }
    ];
    // Need to test BLI Diff, BLI Review, BudgetLines, CANBudgetLine

    test("sort by bl id #", () => {
        let sortedData = useSortData(bli_list, true, BLI_DIFF_TABLE_HEADERS.BL_ID_NUMBER, SORT_TYPES.BLI_DIFF);

        expect(sortedData).toEqual([
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "IN_EXECUTION"
            }
        ]);

        sortedData = useSortData(bli_list, false, BLI_DIFF_TABLE_HEADERS.BL_ID_NUMBER, SORT_TYPES.BLI_REVIEW);

        expect(sortedData).toEqual([
            {
                id: 15002,
                agreement_name: "B Agreement",
                services_component: 1,
                date_needed: "2045-03-15T10:00:00Z",
                fiscal_year: 2045,
                canDisplayName: "G99DEFG",
                amount: 400,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by obligate by date", () => {
        let sortedData = useSortData(bli_list, true, BLI_DIFF_TABLE_HEADERS.OBLIGATE_BY, SORT_TYPES.BUDGET_LINES);

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);

        sortedData = useSortData(bli_list, false, BLI_DIFF_TABLE_HEADERS.OBLIGATE_BY, SORT_TYPES.CAN_BLI);

        expect(sortedData).toEqual([
            {
                id: 15001,
                agreement_name: "C Agreement",
                services_component: 2,
                date_needed: "2044-04-15T10:00:00Z",
                fiscal_year: 2044,
                can: { display_name: "G99HIJK" },
                amount: 300,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "PLANNED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by fiscal year", () => {
        let sortedData = useSortData(bli_list, true, BLI_DIFF_TABLE_HEADERS.FISCAL_YEAR, SORT_TYPES.CAN_BLI);

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by can id", () => {
        let sortedData = useSortData(bli_list, false, BLI_DIFF_TABLE_HEADERS.CAN_ID, SORT_TYPES.BLI_DIFF);

        expect(sortedData).toEqual([
            {
                id: 15000,
                agreement_name: "A Agreement",
                services_component: 1,
                date_needed: "2046-03-15T10:00:00Z",
                fiscal_year: 2046,
                can: { display_name: "G99ABCD" },
                amount: 200,
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
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
                proc_shop_fee_percentage: 0.005,
                status: "OBLIGATED",
                created_on: "2023-03-15T10:00:00Z"
            }
        ]);
    });

    test("sort by amount");

    test("sort by fee");

    test("sort by total");

    test("sort by status");
});

describe("useSortData test AllBudgetLines sort", () => {
    // const bli_list = [
    //     {
    //         id: 15000,
    //         agreement_name: "A Agreement",
    //         services_component: 1,
    //         date_needed: "2046-03-15T10:00:00Z",
    //         fiscal_year: 2046,
    //         can_number: "G99ABCD",
    //         amount: 200,
    //         proc_shop_fee_percentage: 0.005,
    //         status: "PLANNED",
    //         created_on: "2023-03-15T10:00:00Z"
    //     },
    //     {
    //         id: 15001,
    //         agreement_name: "C Agreement",
    //         services_component: 2,
    //         date_needed: "2044-04-15T10:00:00Z",
    //         fiscal_year: 2044,
    //         can_number: "G99HIJK",
    //         amount: 300,
    //         proc_shop_fee_percentage: 0.005,
    //         status: "OBLIGATED",
    //         created_on: "2023-03-15T10:00:00Z"
    //     },
    //     {
    //         id: 15002,
    //         agreement_name: "B Agreement",
    //         services_component: 1,
    //         date_needed: "2045-03-15T10:00:00Z",
    //         fiscal_year: 2045,
    //         can_number: "G99DEFG",
    //         amount: 400,
    //         proc_shop_fee_percentage: 0.005,
    //         status: "IN_EXECUTION",
    //         created_on: "2023-03-15T10:00:00Z"
    //     }
    // ];
    test("sort by bli id #");

    test("sort by agreement name");

    test("sort by service component");

    test("sort by obligate by date");

    test("sort by fiscal year");

    test("sort by can number");

    test("sort by total");

    test("sort by status");
});

describe("useSortData test funding received sort", () => {
    test("sort by funding id");

    test("sort by fiscal year");

    test("sort by funding received");

    test("sort by budget percent");
});
