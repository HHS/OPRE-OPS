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
