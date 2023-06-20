import { render, act } from "@testing-library/react";
import useSortableData from "./useSortableData";

const TestComponent = ({ items, config, onHookResult }) => {
    const hookResult = useSortableData(items, config);
    onHookResult(hookResult);
    return null;
};

const renderTestComponent = (items, config, onHookResult) => {
    render(<TestComponent items={items} config={config} onHookResult={onHookResult} />);
};

describe("useSortableData", () => {
    const items = [
        { id: 1, name: "John", age: 28 },
        { id: 2, name: "Jane", age: 30 },
        { id: 3, name: "Bob", age: 20 },
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
            { id: 1, name: "John", age: 28 },
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
            { id: 3, name: "Bob", age: 20 },
        ]);
    });
});
