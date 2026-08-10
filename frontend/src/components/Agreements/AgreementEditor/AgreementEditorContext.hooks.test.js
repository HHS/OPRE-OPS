import { describe, expect, it } from "vitest";
import { defaultState, editAgreementReducer } from "./AgreementEditorContext.hooks";

describe("editAgreementReducer - RESEED_GRANT_NUMBERS", () => {
    it("reseeds grant_numbers and clears deleted_grant_numbers_ids in the same dispatch", () => {
        const state = {
            ...defaultState,
            grant_numbers: [{ id: 1, number: 1 }],
            deleted_grant_numbers_ids: [99]
        };
        const reseeded = [
            { id: 2, number: 1 },
            { id: 3, number: 2 }
        ];

        const next = editAgreementReducer(state, {
            type: "RESEED_GRANT_NUMBERS",
            payload: reseeded
        });

        expect(next.grant_numbers).toEqual(reseeded);
        // Critical: a reseed (e.g. after a save-failure revert) must not leave a stale
        // delete-id behind, or it would be resent on the next save.
        expect(next.deleted_grant_numbers_ids).toEqual([]);
    });

    it("defaults grant_numbers to [] when payload is null/undefined and still clears deletes", () => {
        const state = {
            ...defaultState,
            grant_numbers: [{ id: 1, number: 1 }],
            deleted_grant_numbers_ids: [99]
        };

        const next = editAgreementReducer(state, {
            type: "RESEED_GRANT_NUMBERS",
            payload: undefined
        });

        expect(next.grant_numbers).toEqual([]);
        expect(next.deleted_grant_numbers_ids).toEqual([]);
    });
});

describe("editAgreementReducer - budget line items", () => {
    it("ADD_BUDGET_LINE_ITEM appends to budget_line_items", () => {
        const state = { ...defaultState, budget_line_items: [{ id: "a", amount: 100 }] };

        const next = editAgreementReducer(state, {
            type: "ADD_BUDGET_LINE_ITEM",
            payload: { id: "b", amount: 200 }
        });

        expect(next.budget_line_items).toEqual([
            { id: "a", amount: 100 },
            { id: "b", amount: 200 }
        ]);
    });

    it("UPDATE_BUDGET_LINE_ITEM replaces the matching item by id", () => {
        const state = {
            ...defaultState,
            budget_line_items: [
                { id: "a", amount: 100 },
                { id: "b", amount: 200 }
            ]
        };

        const next = editAgreementReducer(state, {
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: { id: "a", amount: 999 }
        });

        expect(next.budget_line_items).toEqual([
            { id: "a", amount: 999 },
            { id: "b", amount: 200 }
        ]);
    });

    it("UPDATE_BUDGET_LINE_ITEM is a no-op if no item matches the id", () => {
        const state = { ...defaultState, budget_line_items: [{ id: "a", amount: 100 }] };

        const next = editAgreementReducer(state, {
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: { id: "missing", amount: 999 }
        });

        expect(next.budget_line_items).toEqual([{ id: "a", amount: 100 }]);
    });

    it("DELETE_BUDGET_LINE_ITEM filters by id and appends the id to deleted_budget_line_items_ids", () => {
        const state = {
            ...defaultState,
            budget_line_items: [
                { id: "a", amount: 100 },
                { id: "b", amount: 200 }
            ],
            deleted_budget_line_items_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_BUDGET_LINE_ITEM",
            payload: { id: "a", amount: 100 }
        });

        expect(next.budget_line_items).toEqual([{ id: "b", amount: 200 }]);
        expect(next.deleted_budget_line_items_ids).toEqual(["a"]);
    });

    it("DELETE_BUDGET_LINE_ITEM does not append to deleted_budget_line_items_ids when payload has no id", () => {
        const state = {
            ...defaultState,
            budget_line_items: [{ id: "a", amount: 100 }],
            deleted_budget_line_items_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_BUDGET_LINE_ITEM",
            payload: { amount: 100 }
        });

        expect(next.deleted_budget_line_items_ids).toEqual([]);
    });

    it("RESEED_BUDGET_LINE_ITEMS replaces budget_line_items and clears deleted_budget_line_items_ids", () => {
        const state = {
            ...defaultState,
            budget_line_items: [{ id: "a", amount: 100 }],
            deleted_budget_line_items_ids: ["z"]
        };
        const reseeded = [{ id: "c", amount: 300 }];

        const next = editAgreementReducer(state, {
            type: "RESEED_BUDGET_LINE_ITEMS",
            payload: reseeded
        });

        expect(next.budget_line_items).toEqual(reseeded);
        expect(next.deleted_budget_line_items_ids).toEqual([]);
    });

    it("RESEED_BUDGET_LINE_ITEMS defaults to [] when payload is null/undefined", () => {
        const state = {
            ...defaultState,
            budget_line_items: [{ id: "a", amount: 100 }],
            deleted_budget_line_items_ids: ["z"]
        };

        const next = editAgreementReducer(state, {
            type: "RESEED_BUDGET_LINE_ITEMS",
            payload: undefined
        });

        expect(next.budget_line_items).toEqual([]);
        expect(next.deleted_budget_line_items_ids).toEqual([]);
    });
});
