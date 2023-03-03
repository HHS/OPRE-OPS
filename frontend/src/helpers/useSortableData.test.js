import { renderHook, act } from "@testing-library/react-hooks";
import useSortableData from "./useSortableData";

describe("useSortableData", () => {
    const items = [
        { id: 1, name: "John", age: 25 },
        { id: 2, name: "Jane", age: 30 },
        { id: 3, name: "Bob", age: 20 },
    ];

    test("should return unsorted items when config is null", () => {
        const { result } = renderHook(() => useSortableData(items, null));

        expect(result.current.items).toEqual([
            { id: 1, name: "John", age: 25 },
            { id: 2, name: "Jane", age: 30 },
            { id: 3, name: "Bob", age: 20 },
        ]);
    });

    test("should update sortConfig when requestSort is called", () => {
        const { result } = renderHook(() => useSortableData(items));

        act(() => {
            result.current.requestSort("name");
        });

        expect(result.current.sortConfig).toEqual({ key: "name", direction: "ascending" });

        act(() => {
            result.current.requestSort("name");
        });

        expect(result.current.sortConfig).toEqual({ key: "name", direction: "descending" });
    });

    test("should sort items by name in ascending order", () => {
        const { result } = renderHook(() => useSortableData(items));

        act(() => {
            result.current.requestSort("name");
        });

        expect(result.current.items).toEqual([
            { id: 3, name: "Bob", age: 20 },
            { id: 2, name: "Jane", age: 30 },
            { id: 1, name: "John", age: 25 },
        ]);
    });

    test("should sort items by name in descending order", () => {
        const { result } = renderHook(() => useSortableData(items));

        act(() => {
            result.current.requestSort("name");
        });

        act(() => {
            result.current.requestSort("name");
        });

        expect(result.current.items).toEqual([
            { id: 1, name: "John", age: 25 },
            { id: 2, name: "Jane", age: 30 },
            { id: 3, name: "Bob", age: 20 },
        ]);
    });
});
