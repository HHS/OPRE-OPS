import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const addAgreementMock = vi.fn();
const triggerGetAgreementsMock = vi.fn();
const unwrapMock = vi.fn();
const updateAgreementMock = vi.fn();
const deleteAgreementMock = vi.fn();
const navigateMock = vi.fn();
const setAlertMock = vi.fn();
const useEditAgreementMock = vi.fn();
const useEditAgreementDispatchMock = vi.fn();
const useSetStateMock = vi.fn();
const useUpdateAgreementMock = vi.fn();
const useSelectorMock = vi.fn();
const useLocationMock = vi.fn();
const hasStateChangedMock = vi.fn();
const scrollToCenterMock = vi.fn();
const setIsCancellingMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useLocation: () => useLocationMock(),
        useNavigate: () => navigateMock
    };
});

vi.mock("react-redux", () => ({
    useSelector: (selector) => useSelectorMock(selector)
}));

vi.mock("../../../api/opsAPI", () => ({
    useAddAgreementMutation: () => [addAgreementMock],
    useDeleteAgreementMutation: () => [deleteAgreementMock],
    useGetProjectsQuery: () => ({ data: { projects: [] }, error: null, isLoading: false }),
    useGetProductServiceCodesQuery: () => ({ data: [], error: null, isLoading: false }),
    useLazyGetAgreementsQuery: () => [triggerGetAgreementsMock],
    useUpdateAgreementMutation: () => [updateAgreementMock]
}));

vi.mock("../../../helpers/scrollToCenter.helper", () => ({
    scrollToCenter: (...args) => scrollToCenterMock(...args)
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: setAlertMock })
}));

vi.mock("../../../hooks/useHasStateChanged.hooks", () => ({
    __esModule: true,
    default: (...args) => hasStateChangedMock(...args)
}));

vi.mock("../../../hooks/useNavigationBlocker.hooks", () => ({
    __esModule: true,
    default: () => ({
        showBlockerModal: false,
        setShowBlockerModal: vi.fn(),
        blockerModalProps: {},
        setIsCancelling: setIsCancellingMock
    })
}));

vi.mock("./AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => useEditAgreementMock(),
    useEditAgreementDispatch: () => useEditAgreementDispatchMock(),
    useSetState: (key) => useSetStateMock(key),
    useUpdateAgreement: (key) => useUpdateAgreementMock(key)
}));

import useAgreementEditForm from "./AgreementEditForm.hooks";

const makeAgreement = (overrides = {}) => ({
    id: undefined,
    agreement_type: "CONTRACT",
    name: "",
    nick_name: undefined,
    project_id: undefined,
    team_members: [],
    ...overrides
});

const makeEditState = (agreementOverrides = {}) => ({
    agreement: makeAgreement(agreementOverrides),
    selected_project: {},
    selected_procurement_shop: {},
    selected_product_service_code: {},
    selected_project_officer: {},
    selected_alternate_project_officer: {}
});

const renderUseAgreementEditForm = (args = {}) => {
    const defaults = {
        isAgreementAwarded: false,
        areAnyBudgetLinesPlanned: false,
        setHasAgreementChanged: vi.fn(),
        goBack: vi.fn(),
        goToNext: vi.fn(),
        isReviewMode: false,
        isEditMode: false,
        setIsEditMode: vi.fn(),
        selectedAgreementId: undefined,
        cancelHeading: undefined
    };
    const merged = { ...defaults, ...args };
    return renderHook(() =>
        useAgreementEditForm(
            merged.isAgreementAwarded,
            merged.areAnyBudgetLinesPlanned,
            merged.setHasAgreementChanged,
            merged.goBack,
            merged.goToNext,
            merged.isReviewMode,
            merged.isEditMode,
            merged.setIsEditMode,
            merged.selectedAgreementId,
            merged.cancelHeading
        )
    );
};

const setLazyQueryResult = (count) => {
    unwrapMock.mockResolvedValueOnce({ count, agreements: [] });
    triggerGetAgreementsMock.mockReturnValueOnce({ unwrap: unwrapMock });
};

describe("useAgreementEditForm uniqueness checks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/create" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
        useEditAgreementMock.mockReturnValue(makeEditState());
    });

    it("clears the title error when the value is empty", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "   ");
        });

        // No API call for empty/whitespace input
        expect(triggerGetAgreementsMock).not.toHaveBeenCalled();
        expect(result.current.uniquenessErrors.name).toEqual([]);
    });

    it("skips the title check when no agreement_type is selected", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: undefined }));
        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Some Title");
        });

        expect(triggerGetAgreementsMock).not.toHaveBeenCalled();
    });

    it("sets a duplicate-title error when a conflict is found in create mode", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.checkUniqueOnBlur.flush();
            result.current.checkUniqueOnBlur("name", "Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual(["This title already exists. Try a different one"]);
        });
        expect(triggerGetAgreementsMock).toHaveBeenCalledWith({
            filters: {
                agreementName: [{ name: "Existing Title" }],
                agreementType: [{ type: "CONTRACT" }]
            },
            page: 0,
            limit: 1
        });
    });

    it("does not flag the current agreement as a duplicate of itself in edit mode", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 42,
                agreement_type: "CONTRACT",
                name: "My Title"
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm({ isEditMode: true });

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "My Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual([]);
        });
    });

    it("flags a conflict in edit mode when the title matches a different agreement", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 42,
                agreement_type: "CONTRACT",
                name: "Original Title"
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm({ isEditMode: true });

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Different Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual(["This title already exists. Try a different one"]);
        });
    });

    it("sets a duplicate-nickname error when a conflict is found", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("nick_name", "Taken");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.nick_name).toEqual([
                "This nickname already exists. Try a different one"
            ]);
        });
        expect(triggerGetAgreementsMock).toHaveBeenCalledWith({
            filters: { nickName: ["Taken"] },
            page: 0,
            limit: 1
        });
    });

    it("skips the nickname uniqueness check when the value is only whitespace", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("nick_name", "   ");
            await result.current.checkUniqueOnBlur.flush();
        });

        expect(triggerGetAgreementsMock).not.toHaveBeenCalled();
        expect(result.current.uniquenessErrors.nick_name).toEqual([]);
    });

    it("clears errors and does not throw when the API call fails", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        unwrapMock.mockRejectedValueOnce(new Error("network down"));
        triggerGetAgreementsMock.mockReturnValueOnce({ unwrap: unwrapMock });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Anything");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.uniquenessErrors.name).toEqual([]);
        });
    });

    it("disables the Continue button while uniqueness errors exist", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                agreement_type: "CONTRACT",
                name: "Existing Title",
                project_id: 5
            })
        );
        setLazyQueryResult(1);

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            result.current.checkUniqueOnBlur("name", "Existing Title");
            await result.current.checkUniqueOnBlur.flush();
        });

        await waitFor(() => {
            expect(result.current.shouldDisableBtn).toBe(true);
        });
    });
});

describe("useAgreementEditForm scrolls to first conflicting field on submit", () => {
    let rafSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/create" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
        useEditAgreementMock.mockReturnValue(makeEditState());
        rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb();
            return 0;
        });
    });

    afterEach(() => {
        rafSpy.mockRestore();
    });

    it("handleContinue scrolls to the title field when the title is a duplicate", async () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT", name: "Existing Title" }));
        setLazyQueryResult(1);

        const goToNext = vi.fn();
        const { result } = renderUseAgreementEditForm({ goToNext });

        await act(async () => {
            await result.current.handleContinue();
        });

        expect(scrollToCenterMock).toHaveBeenCalledWith("name");
        expect(goToNext).not.toHaveBeenCalled();
        expect(updateAgreementMock).not.toHaveBeenCalled();
    });

    it("handleDraft scrolls to the nickname field when only the nickname is a duplicate", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({ agreement_type: "CONTRACT", name: "Unique Title", nick_name: "Taken" })
        );
        // First call resolves the title check (no conflict), second resolves the nickname check (conflict).
        unwrapMock.mockResolvedValueOnce({ count: 0, agreements: [] });
        unwrapMock.mockResolvedValueOnce({ count: 1, agreements: [] });
        triggerGetAgreementsMock.mockReturnValue({ unwrap: unwrapMock });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(scrollToCenterMock).toHaveBeenCalledWith("nickname");
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });

    it("does not scroll when both title and nickname pass uniqueness checks", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({ agreement_type: "CONTRACT", name: "Unique Title", nick_name: "UniqueNick" })
        );
        unwrapMock.mockResolvedValueOnce({ count: 0, agreements: [] });
        unwrapMock.mockResolvedValueOnce({ count: 0, agreements: [] });
        triggerGetAgreementsMock.mockReturnValue({ unwrap: unwrapMock });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleContinue();
        });

        expect(scrollToCenterMock).not.toHaveBeenCalled();
    });

    it("handleContinue treats whitespace-only nickname as empty and does not block submission", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({ agreement_type: "CONTRACT", name: "Valid Title", nick_name: "   " })
        );
        // Title check passes (no conflict), nickname is whitespace so no API call for it
        unwrapMock.mockResolvedValueOnce({ count: 0, agreements: [] });
        triggerGetAgreementsMock.mockReturnValue({ unwrap: unwrapMock });

        const goToNext = vi.fn();
        const { result } = renderUseAgreementEditForm({ goToNext });

        await act(async () => {
            await result.current.handleContinue();
        });

        expect(scrollToCenterMock).not.toHaveBeenCalled();
        expect(result.current.uniquenessErrors.nick_name).toEqual([]);
    });

    it("handleDraft treats whitespace-only nickname as empty and does not block submission", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({ agreement_type: "CONTRACT", name: "Valid Title", nick_name: "\t\n" })
        );
        unwrapMock.mockResolvedValueOnce({ count: 0, agreements: [] });
        triggerGetAgreementsMock.mockReturnValue({ unwrap: unwrapMock });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(scrollToCenterMock).not.toHaveBeenCalled();
        expect(result.current.uniquenessErrors.nick_name).toEqual([]);
    });
});

describe("useAgreementEditForm - handleDraft creates new agreements", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/create" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(true);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
        addAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
        updateAgreementMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
        unwrapMock.mockResolvedValue({ count: 0, agreements: [] });
        triggerGetAgreementsMock.mockReturnValue({ unwrap: unwrapMock });
    });

    it("calls addAgreement when agreement has no id (new draft)", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                name: "Test Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }]
            })
        );

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).toHaveBeenCalled();
        // Bypasses the navigation blocker and defers navigation to the success alert's
        // redirectUrl instead of calling navigate() directly, so the "unsaved changes"
        // modal does not appear (issue #5910).
        expect(setIsCancellingMock).toHaveBeenCalledWith(true);
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Agreement Draft Saved",
                redirectUrl: "/agreements"
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });

    it("does NOT call addAgreement when agreement has an id (existing agreement)", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 123,
                name: "Existing Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }]
            })
        );

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).not.toHaveBeenCalled();
        // Existing draft with changes: saveAgreement("/agreements") updates it and carries the
        // redirectUrl on its own success alert, so navigate() is not called directly.
        expect(setIsCancellingMock).toHaveBeenCalledWith(true);
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                heading: "Agreement Updated",
                redirectUrl: "/agreements"
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });

    it("shows error alert when addAgreement fails", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                name: "Test Agreement",
                agreement_type: "CONTRACT",
                team_members: []
            })
        );
        addAgreementMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("API error")) });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).toHaveBeenCalled();
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                heading: "Error",
                message: "An error occurred while saving the agreement."
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });

    it("does not set error alert when updateAgreement fails (saveAgreement handles it)", async () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                id: 123,
                name: "Existing Agreement",
                agreement_type: "CONTRACT",
                team_members: [{ id: 1, full_name: "Test User" }]
            })
        );
        updateAgreementMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("Update failed")) });

        const { result } = renderUseAgreementEditForm();

        await act(async () => {
            await result.current.handleDraft();
        });

        expect(addAgreementMock).not.toHaveBeenCalled();
        expect(setAlertMock).toHaveBeenCalledTimes(1);
        expect(setAlertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "error",
                heading: "Error",
                redirectUrl: "/error"
            })
        );
        expect(navigateMock).not.toHaveBeenCalledWith("/agreements");
    });
});

describe("useAgreementEditForm - isGrant and handleAgreementFilterChange", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/create" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
    });

    it("isGrant is true when agreement_type is GRANT", () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "GRANT" }));
        const { result } = renderUseAgreementEditForm();
        expect(result.current.isGrant).toBe(true);
    });

    it("isGrant is false when agreement_type is CONTRACT", () => {
        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        const { result } = renderUseAgreementEditForm();
        expect(result.current.isGrant).toBe(false);
    });

    it("handleAgreementFilterChange clears contract-only state when switching to GRANT", () => {
        const dispatchMock = vi.fn();
        useEditAgreementDispatchMock.mockReturnValue(dispatchMock);

        const setContractTypeMock = vi.fn();
        const setServiceReqTypeMock = vi.fn();
        const setAgreementReasonMock = vi.fn();
        const setAgreementVendorMock = vi.fn();
        const setAgreementNotesMock = vi.fn();
        const setAgreementTypeMock = vi.fn();
        const setSelectedProductServiceCodeMock = vi.fn();
        const setSelectedProjectOfficerMock = vi.fn();
        const setSelectedAlternateProjectOfficerMock = vi.fn();

        useUpdateAgreementMock.mockImplementation((key) => {
            if (key === "contract_type") return setContractTypeMock;
            if (key === "service_requirement_type") return setServiceReqTypeMock;
            if (key === "agreement_reason") return setAgreementReasonMock;
            if (key === "vendor") return setAgreementVendorMock;
            if (key === "notes") return setAgreementNotesMock;
            if (key === "agreement_type") return setAgreementTypeMock;
            return vi.fn();
        });
        useSetStateMock.mockImplementation((key) => {
            if (key === "selected_product_service_code") return setSelectedProductServiceCodeMock;
            if (key === "selected_project_officer") return setSelectedProjectOfficerMock;
            if (key === "selected_alternate_project_officer") return setSelectedAlternateProjectOfficerMock;
            return vi.fn();
        });

        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "CONTRACT" }));
        const { result } = renderUseAgreementEditForm();

        act(() => {
            result.current.handleAgreementFilterChange("GRANT");
        });

        expect(setAgreementTypeMock).toHaveBeenCalledWith("GRANT");
        expect(setContractTypeMock).toHaveBeenCalledWith(null);
        expect(setServiceReqTypeMock).toHaveBeenCalledWith(null);
        expect(setAgreementReasonMock).toHaveBeenCalledWith(null);
        expect(setAgreementVendorMock).toHaveBeenCalledWith(null);
        expect(setAgreementNotesMock).toHaveBeenCalledWith(null);
        expect(setSelectedProductServiceCodeMock).toHaveBeenCalledWith(null);
        expect(setSelectedProjectOfficerMock).toHaveBeenCalledWith(null);
        expect(setSelectedAlternateProjectOfficerMock).toHaveBeenCalledWith(null);
        expect(dispatchMock).toHaveBeenCalledWith({ type: "UPDATE_AGREEMENT", key: "team_members", value: [] });
        expect(dispatchMock).toHaveBeenCalledWith({ type: "SET_RESEARCH_METHODOLOGIES", payload: [] });
        expect(dispatchMock).toHaveBeenCalledWith({ type: "SET_SPECIAL_TOPICS", payload: [] });
    });

    it("handleAgreementFilterChange clears grant-only fields when switching away from GRANT", () => {
        const setNofoNumberMock = vi.fn();
        const setAlnNumberMock = vi.fn();
        const setFundingPeriodMonthsMock = vi.fn();
        const setSelectedAlternateProjectOfficerMock = vi.fn();
        const setAlternateProjectOfficerIdMock = vi.fn();

        useUpdateAgreementMock.mockImplementation((key) => {
            if (key === "nofo_number") return setNofoNumberMock;
            if (key === "aln_number") return setAlnNumberMock;
            if (key === "funding_period_months") return setFundingPeriodMonthsMock;
            if (key === "alternate_project_officer_id") return setAlternateProjectOfficerIdMock;
            return vi.fn();
        });
        useSetStateMock.mockImplementation((key) => {
            if (key === "selected_alternate_project_officer") return setSelectedAlternateProjectOfficerMock;
            return vi.fn();
        });

        useEditAgreementMock.mockReturnValue(makeEditState({ agreement_type: "GRANT" }));
        const { result } = renderUseAgreementEditForm();

        act(() => {
            result.current.handleAgreementFilterChange("CONTRACT");
        });

        expect(setNofoNumberMock).toHaveBeenCalledWith(null);
        expect(setAlnNumberMock).toHaveBeenCalledWith(null);
        expect(setFundingPeriodMonthsMock).toHaveBeenCalledWith(null);
        // Alternate PO / Project Specialist is a SHARED field — must NOT be cleared on this transition.
        expect(setSelectedAlternateProjectOfficerMock).not.toHaveBeenCalled();
        expect(setAlternateProjectOfficerIdMock).not.toHaveBeenCalled();
    });
});

describe("useAgreementEditForm - runValidate project_officer validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useLocationMock.mockReturnValue({ pathname: "/agreements/1/edit" });
        useSelectorMock.mockReturnValue(false);
        hasStateChangedMock.mockReturnValue(false);
        useEditAgreementDispatchMock.mockReturnValue(vi.fn());
        useSetStateMock.mockReturnValue(vi.fn());
        useUpdateAgreementMock.mockReturnValue(vi.fn());
    });

    it("clears project_officer validation error when a valid officer id is provided via override", () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                agreement_type: "CONTRACT",
                project_officer_id: null
            })
        );

        const { result, rerender } = renderUseAgreementEditForm({ isReviewMode: true });

        act(() => {
            result.current.runValidate("project_officer", 5, { project_officer_id: 5 });
        });
        rerender();

        const errors = result.current.res.getErrors("project_officer");
        expect(errors).toEqual([]);
    });

    it("shows project_officer validation error when value is null (cleared)", () => {
        useEditAgreementMock.mockReturnValue(
            makeEditState({
                agreement_type: "CONTRACT",
                project_officer_id: 5
            })
        );

        const { result, rerender } = renderUseAgreementEditForm({ isReviewMode: true });

        act(() => {
            result.current.runValidate("project_officer", null, { project_officer_id: null });
        });
        rerender();

        const errors = result.current.res.getErrors("project_officer");
        expect(errors).toContain("This is required information");
    });
});
