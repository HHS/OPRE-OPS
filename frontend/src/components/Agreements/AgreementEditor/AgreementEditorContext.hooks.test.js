import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EditAgreementProvider } from "./AgreementEditorContext";
import { defaultState, editAgreementReducer, useEditAgreement } from "./AgreementEditorContext.hooks";

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

describe("editAgreementReducer - CLEAR_SERVICES_COMPONENTS", () => {
    it("empties services_components and appends their ids to deleted_services_components_ids", () => {
        const state = {
            ...defaultState,
            services_components: [
                { id: 10, number: 1 },
                { id: 11, number: 2 }
            ],
            deleted_services_components_ids: [99],
            budget_line_items: []
        };

        const next = editAgreementReducer(state, { type: "CLEAR_SERVICES_COMPONENTS" });

        expect(next.services_components).toEqual([]);
        // Prior deletions must be preserved, not replaced — they still need to reach the API.
        expect(next.deleted_services_components_ids).toEqual([99, 10, 11]);
    });

    it("does not record an id for an unsaved (not-yet-persisted) services component", () => {
        const state = {
            ...defaultState,
            services_components: [{ number: 1 }], // no id — never saved to the API
            deleted_services_components_ids: [],
            budget_line_items: []
        };

        const next = editAgreementReducer(state, { type: "CLEAR_SERVICES_COMPONENTS" });

        expect(next.deleted_services_components_ids).toEqual([]);
    });

    it("reconciles budget lines that referenced a cleared services component", () => {
        const state = {
            ...defaultState,
            services_components: [{ id: 10, number: 1 }],
            deleted_services_components_ids: [],
            budget_line_items: [
                {
                    id: 1,
                    services_component_id: 10,
                    services_component_number: 1,
                    serviceComponentGroupingLabel: "1"
                },
                { id: 2, services_component_id: null, services_component_number: 0 }
            ]
        };

        const next = editAgreementReducer(state, { type: "CLEAR_SERVICES_COMPONENTS" });

        expect(next.budget_line_items[0]).toMatchObject({
            services_component_id: null,
            services_component_number: 0,
            serviceComponentGroupingLabel: "0"
        });
        // A BLI with no SC link to begin with should be left untouched.
        expect(next.budget_line_items[1]).toEqual(state.budget_line_items[1]);
    });

    it("reconciles a not-yet-persisted budget line that links by services_component_number only", () => {
        // handleAddBLI never stamps services_component_id on a brand-new BLI — only
        // services_component_number. services_component_id is stamped post-save, in
        // addServiceComponentIdToBLI. This is the only case CLEAR_SERVICES_COMPONENTS is ever
        // dispatched for (the type filter is disabled once an agreement exists), so the
        // reconciliation must catch it too, not just the id-based case above.
        const state = {
            ...defaultState,
            services_components: [{ number: 1 }],
            deleted_services_components_ids: [],
            budget_line_items: [{ id: "abc123", services_component_id: undefined, services_component_number: 1 }]
        };

        const next = editAgreementReducer(state, { type: "CLEAR_SERVICES_COMPONENTS" });

        expect(next.budget_line_items[0]).toMatchObject({
            services_component_id: null,
            services_component_number: 0,
            serviceComponentGroupingLabel: "0"
        });
    });
});

describe("editAgreementReducer - CLEAR_GRANT_NUMBERS", () => {
    it("empties grant_numbers and appends their ids to deleted_grant_numbers_ids", () => {
        const state = {
            ...defaultState,
            grant_numbers: [
                { id: 10, number: 1 },
                { id: 11, number: 2 }
            ],
            deleted_grant_numbers_ids: [99],
            budget_line_items: []
        };

        const next = editAgreementReducer(state, { type: "CLEAR_GRANT_NUMBERS" });

        expect(next.grant_numbers).toEqual([]);
        // Prior deletions must be preserved, not replaced — they still need to reach the API.
        expect(next.deleted_grant_numbers_ids).toEqual([99, 10, 11]);
    });

    it("does not record an id for an unsaved (not-yet-persisted) grant number", () => {
        const state = {
            ...defaultState,
            grant_numbers: [{ number: 1 }], // no id — never saved to the API
            deleted_grant_numbers_ids: [],
            budget_line_items: []
        };

        const next = editAgreementReducer(state, { type: "CLEAR_GRANT_NUMBERS" });

        expect(next.deleted_grant_numbers_ids).toEqual([]);
    });

    it("reconciles budget lines that referenced a cleared grant number", () => {
        const state = {
            ...defaultState,
            grant_numbers: [{ id: 10, number: 1 }],
            deleted_grant_numbers_ids: [],
            budget_line_items: [
                { id: 1, grant_number_id: 10, grant_number_number: 1 },
                { id: 2, grant_number_id: null, grant_number_number: 0 }
            ]
        };

        const next = editAgreementReducer(state, { type: "CLEAR_GRANT_NUMBERS" });

        expect(next.budget_line_items[0]).toMatchObject({
            grant_number_id: null,
            grant_number_number: 0
        });
        // A BLI with no grant-number link to begin with should be left untouched.
        expect(next.budget_line_items[1]).toEqual(state.budget_line_items[1]);
    });

    it("reconciles a not-yet-persisted budget line that links by grant_number_number only", () => {
        const state = {
            ...defaultState,
            grant_numbers: [{ number: 1 }],
            deleted_grant_numbers_ids: [],
            budget_line_items: [{ id: "abc123", grant_number_id: undefined, grant_number_number: 1 }]
        };

        const next = editAgreementReducer(state, { type: "CLEAR_GRANT_NUMBERS" });

        expect(next.budget_line_items[0]).toMatchObject({
            grant_number_id: null,
            grant_number_number: 0
        });
    });
});

describe("EditAgreementProvider - officer reseed effects", () => {
    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        agreement_type: "GRANT",
        project_officer_id: 10,
        alternate_project_officer_id: 20,
        team_members: [],
        budget_line_items: []
    };

    it("reseeds selected_project_officer when projectOfficer prop arrives after mount", async () => {
        const officerObject = { id: 10, full_name: "Jane Smith" };

        // Stateful wrapper so we can change the prop after mount
        let setOfficer;
        const Wrapper = ({ children }) => {
            const [po, setPo] = useState({});
            setOfficer = setPo;
            return (
                <EditAgreementProvider
                    agreement={mockAgreement}
                    projectOfficer={po}
                    alternateProjectOfficer={{}}
                >
                    {children}
                </EditAgreementProvider>
            );
        };

        const { result } = renderHook(() => useEditAgreement(), { wrapper: Wrapper });

        // Initially empty — async fetch hasn't resolved yet
        expect(result.current.selected_project_officer).toEqual({});

        // Simulate async getUser() resolving
        await act(async () => setOfficer(officerObject));

        expect(result.current.selected_project_officer).toEqual(officerObject);
    });

    it("reseeds selected_alternate_project_officer when alternateProjectOfficer prop arrives after mount", async () => {
        const altOfficerObject = { id: 20, full_name: "John Doe" };

        let setAltOfficer;
        const Wrapper = ({ children }) => {
            const [apo, setApo] = useState({});
            setAltOfficer = setApo;
            return (
                <EditAgreementProvider
                    agreement={mockAgreement}
                    projectOfficer={{}}
                    alternateProjectOfficer={apo}
                >
                    {children}
                </EditAgreementProvider>
            );
        };

        const { result } = renderHook(() => useEditAgreement(), { wrapper: Wrapper });

        expect(result.current.selected_alternate_project_officer).toEqual({});

        await act(async () => setAltOfficer(altOfficerObject));

        expect(result.current.selected_alternate_project_officer).toEqual(altOfficerObject);
    });

    it("does not clobber selected_project_officer with the empty placeholder object", () => {
        // {} has no .id, so the guard must prevent it from dispatching
        const { result } = renderHook(() => useEditAgreement(), {
            wrapper: ({ children }) => (
                <EditAgreementProvider
                    agreement={mockAgreement}
                    projectOfficer={{}}
                    alternateProjectOfficer={{}}
                >
                    {children}
                </EditAgreementProvider>
            )
        });

        // Should remain the reducer default ({}), not be written by the effect
        expect(result.current.selected_project_officer?.id).toBeUndefined();
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

    it("DELETE_BUDGET_LINE_ITEM filters by id and appends a persisted line's id to deleted_budget_line_items_ids", () => {
        const state = {
            ...defaultState,
            budget_line_items: [
                { id: "a", amount: 100, created_on: "2026-01-01T00:00:00Z" },
                { id: "b", amount: 200, created_on: "2026-01-01T00:00:00Z" }
            ],
            deleted_budget_line_items_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_BUDGET_LINE_ITEM",
            payload: { id: "a", amount: 100, created_on: "2026-01-01T00:00:00Z" }
        });

        expect(next.budget_line_items).toEqual([{ id: "b", amount: 200, created_on: "2026-01-01T00:00:00Z" }]);
        expect(next.deleted_budget_line_items_ids).toEqual(["a"]);
    });

    it("DELETE_BUDGET_LINE_ITEM does not append to deleted_budget_line_items_ids when payload has no id", () => {
        const state = {
            ...defaultState,
            budget_line_items: [{ id: "a", amount: 100, created_on: "2026-01-01T00:00:00Z" }],
            deleted_budget_line_items_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_BUDGET_LINE_ITEM",
            payload: { amount: 100 }
        });

        expect(next.deleted_budget_line_items_ids).toEqual([]);
    });

    it("DELETE_BUDGET_LINE_ITEM removes but does not queue a not-yet-saved line, even with a truthy temp id (OPS-3268)", () => {
        // buildNewBudgetLineItem stamps a cryptoRandomString id on a brand-new line before it's ever
        // saved -- always truthy, and with no created_on (the API hasn't returned one yet).
        const state = {
            ...defaultState,
            budget_line_items: [{ id: "tempId123abc", amount: 100 }],
            deleted_budget_line_items_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_BUDGET_LINE_ITEM",
            payload: { id: "tempId123abc", amount: 100 }
        });

        expect(next.budget_line_items).toEqual([]);
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

describe("editAgreementReducer - DELETE_SERVICE_COMPONENT", () => {
    it("filters the SC out and appends a persisted SC's id to deleted_services_components_ids", () => {
        const state = {
            ...defaultState,
            services_components: [
                { id: 10, number: 1 },
                { id: 11, number: 2 }
            ],
            deleted_services_components_ids: []
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_SERVICE_COMPONENT",
            payload: { id: 10, number: 1 }
        });

        expect(next.services_components).toEqual([{ id: 11, number: 2 }]);
        expect(next.deleted_services_components_ids).toEqual([10]);
    });

    it("unassigns a budget line linked to the deleted SC, but leaves one linked to a surviving SC untouched", () => {
        const state = {
            ...defaultState,
            services_components: [
                { id: 10, number: 1 },
                { id: 11, number: 2 }
            ],
            budget_line_items: [
                { id: 1, services_component_id: 10, services_component_number: 1 },
                { id: 2, services_component_id: 11, services_component_number: 2 }
            ]
        };

        const next = editAgreementReducer(state, {
            type: "DELETE_SERVICE_COMPONENT",
            payload: { id: 10, number: 1 }
        });

        expect(next.budget_line_items[0]).toMatchObject({ services_component_id: null, services_component_number: 0 });
        expect(next.budget_line_items[1]).toEqual(state.budget_line_items[1]);
    });

    // OPS-3268: performDelete dispatches DELETE_BUDGET_LINE_ITEM for every chosen Draft/Planned
    // line BEFORE dispatching DELETE_SERVICE_COMPONENT, relying on this composed sequence --
    // through the real reducer, not a mocked dispatch -- to leave only the kept (OBE/locked)
    // lines for DELETE_SERVICE_COMPONENT's own reconciliation to unassign. Neither action's own
    // isolated test proves this composition actually produces the right final state.
    it("composed with DELETE_BUDGET_LINE_ITEM: chosen lines are removed and queued, the kept OBE line survives unassigned (OPS-3268)", () => {
        const draftLine = { id: 1, status: "DRAFT", services_component_id: 10, created_on: "2026-01-01T00:00:00Z" };
        const plannedLine = {
            id: 2,
            status: "PLANNED",
            services_component_id: 10,
            created_on: "2026-01-01T00:00:00Z"
        };
        const obeLine = { id: 3, is_obe: true, services_component_id: 10, created_on: "2026-01-01T00:00:00Z" };
        const state = {
            ...defaultState,
            services_components: [{ id: 10, number: 1 }],
            budget_line_items: [draftLine, plannedLine, obeLine],
            deleted_budget_line_items_ids: []
        };

        const afterBudgetLineDeletes = [draftLine, plannedLine].reduce(
            (currentState, bli) =>
                editAgreementReducer(currentState, { type: "DELETE_BUDGET_LINE_ITEM", payload: bli }),
            state
        );
        const final = editAgreementReducer(afterBudgetLineDeletes, {
            type: "DELETE_SERVICE_COMPONENT",
            payload: { id: 10, number: 1 }
        });

        expect(final.budget_line_items).toHaveLength(1);
        expect(final.budget_line_items[0]).toMatchObject({
            id: 3,
            is_obe: true,
            services_component_id: null,
            services_component_number: 0,
            serviceComponentGroupingLabel: "0"
        });
        expect(final.deleted_budget_line_items_ids).toEqual([1, 2]);
        expect(final.deleted_services_components_ids).toEqual([10]);
    });
});

describe("editAgreementReducer - ADD_ALN_NUMBER / REMOVE_ALN_NUMBER", () => {
    it("ADD_ALN_NUMBER appends to an existing array", () => {
        const state = { ...defaultState, agreement: { ...defaultState.agreement, aln_numbers: ["93.086"] } };
        const next = editAgreementReducer(state, { type: "ADD_ALN_NUMBER", payload: "93.600" });
        expect(next.agreement.aln_numbers).toEqual(["93.086", "93.600"]);
    });

    it("ADD_ALN_NUMBER handles null aln_numbers from an existing grant loaded via API", () => {
        const state = { ...defaultState, agreement: { ...defaultState.agreement, aln_numbers: null } };
        const next = editAgreementReducer(state, { type: "ADD_ALN_NUMBER", payload: "93.086" });
        expect(next.agreement.aln_numbers).toEqual(["93.086"]);
    });

    it("REMOVE_ALN_NUMBER removes the matching id", () => {
        const state = {
            ...defaultState,
            agreement: { ...defaultState.agreement, aln_numbers: ["93.086", "93.600"] }
        };
        const next = editAgreementReducer(state, { type: "REMOVE_ALN_NUMBER", payload: "93.086" });
        expect(next.agreement.aln_numbers).toEqual(["93.600"]);
    });

    it("REMOVE_ALN_NUMBER handles null aln_numbers from an existing grant loaded via API", () => {
        const state = { ...defaultState, agreement: { ...defaultState.agreement, aln_numbers: null } };
        const next = editAgreementReducer(state, { type: "REMOVE_ALN_NUMBER", payload: "93.086" });
        expect(next.agreement.aln_numbers).toEqual([]);
    });
});
