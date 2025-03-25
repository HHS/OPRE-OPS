import { render, act } from "@testing-library/react";
import useSortableData, { useSortData, SORT_TYPES } from "./use-sortable-data.hooks";
import { AGREEMENT_TABLE_HEADINGS } from "../components/Agreements/AgreementsTable/AgreementsTable.constants";
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

describe("useSortData", () => {
    // name, project title, agreement type, total
    // mock getAgreementSubTotal, getProcurementShopSubTotal
    // findNextBudgetLine
    // findNextNeedBy
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
