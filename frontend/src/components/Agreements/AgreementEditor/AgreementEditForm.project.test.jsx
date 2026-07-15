import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgreementEditForm from "./AgreementEditForm";
import useAgreementEditForm from "./AgreementEditForm.hooks";

vi.mock("./AgreementEditForm.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../ServicesComponents/ContractTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../ServicesComponents/ServiceReqTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../UI/Button/GoBackButton", () => ({ default: () => <div /> }));
vi.mock("../../UI/Cards/DefinitionListCard", () => ({ default: () => <div /> }));
vi.mock("../../UI/Form/Input", () => ({ default: () => <div /> }));
vi.mock("../../UI/Form/Select", () => ({ default: () => <div /> }));
vi.mock("../../UI/Form/TextArea/TextArea", () => ({ default: () => <div /> }));
vi.mock("../../UI/Modals/ConfirmationModal", () => ({ default: () => <div /> }));
vi.mock("../../UI/Modals/SaveChangesAndExitModal", () => ({ default: () => <div /> }));
vi.mock("../AgencySelect", () => ({ default: () => <div /> }));
vi.mock("../AgreementReasonSelect", () => ({ default: () => <div /> }));
vi.mock("../AgreementTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../ProcurementShopSelectWithFee", () => ({ default: () => <div /> }));
vi.mock("../ProductServiceCodeSelect", () => ({ default: () => <div /> }));
vi.mock("../SummaryBox", () => ({ default: () => <div /> }));
vi.mock("../ProjectOfficerComboBox", () => ({ default: () => <div /> }));
vi.mock("../ResearchMethodologyComboBox", () => ({ default: () => <div /> }));
vi.mock("../SpecialTopicComboBox", () => ({ default: () => <div /> }));
vi.mock("../TeamMemberComboBox", () => ({ default: () => <div /> }));
vi.mock("../TeamMemberList", () => ({ default: () => <div /> }));
vi.mock("../../Projects/ProjectComboBox", () => ({
    default: () => <div data-testid="project-combobox-mock" />
}));

const baseHookState = {
    cn: () => "",
    isWizardMode: false,
    isAgreementCreated: true,
    agreement: { id: 1 },
    agreementNotes: "",
    agreementVendor: "",
    agreementType: "CONTRACT",
    agreementTitle: "Agreement",
    agreementNickName: "Nickname",
    agreementDescription: "Description",
    agreementReason: "NEW_REQ",
    selectedTeamMembers: [],
    projects: [{ id: 1000, title: "Project A", short_title: "PA" }],
    selectedProject: { id: 1000, title: "Project A", short_title: "PA" },
    contractType: "FIRM_FIXED_PRICE",
    serviceReqType: "NON_SEVERABLE",
    servicingAgency: null,
    requestingAgency: null,
    specialTopics: [],
    researchMethodologies: [],
    productServiceCodes: [],
    selectedProductServiceCode: null,
    selectedProcurementShop: null,
    selectedProjectOfficer: null,
    selectedAlternateProjectOfficer: null,
    isGrant: false,
    nofoNumber: "",
    alnNumber: "",
    fundingPeriodMonths: null,
    setNofoNumber: vi.fn(),
    setAlnNumber: vi.fn(),
    setFundingPeriodMonths: vi.fn(),
    showModal: false,
    setShowModal: vi.fn(),
    modalProps: {},
    selectedAgreementFilter: "CONTRACT",
    vendorDisabled: false,
    immutableFields: [],
    isAgreementAA: false,
    isSuperUser: false,
    shouldDisableBtn: false,
    changeSelectedProject: vi.fn(),
    changeSelectedProductServiceCode: vi.fn(),
    changeSelectedProjectOfficer: vi.fn(),
    changeSelectedAlternateProjectOfficer: vi.fn(),
    setSelectedTeamMembers: vi.fn(),
    removeTeamMember: vi.fn(),
    setResearchMethodology: vi.fn(),
    setSpecialTopics: vi.fn(),
    handleContinue: vi.fn(),
    handleDraft: vi.fn(),
    handleCancel: vi.fn(),
    handleOnChangeSelectedProcurementShop: vi.fn(),
    runValidate: vi.fn(),
    checkUniqueOnBlur: vi.fn(),
    uniquenessErrors: { name: [], nick_name: [] },
    isProcurementShopDisabled: false,
    disabledMessage: vi.fn(),
    fundingMethod: [],
    agreementFilterOptions: [],
    handleAgreementFilterChange: vi.fn(),
    setAgreementDescription: vi.fn(),
    setAgreementNickName: vi.fn(),
    setAgreementReason: vi.fn(),
    setAgreementTitle: vi.fn(),
    setContractType: vi.fn(),
    setServiceReqType: vi.fn(),
    setRequestingAgency: vi.fn(),
    setServicingAgency: vi.fn(),
    setAgreementVendor: vi.fn(),
    setAgreementNotes: vi.fn(),
    setAgreementType: vi.fn(),
    res: { getErrors: () => [] },
    blocker: {},
    showBlockerModal: false,
    setShowBlockerModal: vi.fn(),
    blockerModalProps: {},
    saveAgreement: vi.fn(),
    verifyUniquenessBeforeSubmit: vi.fn().mockResolvedValue(null),
    isLoadingProductServiceCodes: false,
    isLoadingProjects: false
};

describe("AgreementEditForm Project field", () => {
    it("renders project combobox in non-wizard mode", () => {
        useAgreementEditForm.mockReturnValue({ ...baseHookState, isWizardMode: false });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
            />
        );

        expect(screen.getByTestId("project-combobox-mock")).toBeInTheDocument();
    });

    it("does not render project combobox in wizard mode", () => {
        useAgreementEditForm.mockReturnValue({ ...baseHookState, isWizardMode: true });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
            />
        );

        expect(screen.queryByTestId("project-combobox-mock")).not.toBeInTheDocument();
    });

    it("disables save button when form has required field errors", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: false,
            shouldDisableBtn: true
        });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
            />
        );

        expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
    });

    it("hides the footer action row when hideFooterButtons is true", () => {
        useAgreementEditForm.mockReturnValue({ ...baseHookState, isWizardMode: false });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                hideFooterButtons={true}
            />
        );

        expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    });

    it("runs verify then save and reports ok via onSaved when saveTrigger increments", async () => {
        const saveAgreement = vi.fn().mockResolvedValue(true);
        const verifyUniquenessBeforeSubmit = vi.fn().mockResolvedValue(null);
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: false,
            saveAgreement,
            verifyUniquenessBeforeSubmit
        });
        const onSaved = vi.fn();

        const { rerender } = render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={0}
                onSaved={onSaved}
            />
        );
        expect(onSaved).not.toHaveBeenCalled();

        rerender(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={1}
                onSaved={onSaved}
            />
        );

        await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ok: true }));
        expect(verifyUniquenessBeforeSubmit).toHaveBeenCalled();
        expect(saveAgreement).toHaveBeenCalledWith(null, false, true, true);
    });

    it("reports the conflict field via onSaved when uniqueness check fails", async () => {
        const saveAgreement = vi.fn();
        const verifyUniquenessBeforeSubmit = vi.fn().mockResolvedValue("name");
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: false,
            saveAgreement,
            verifyUniquenessBeforeSubmit
        });
        const onSaved = vi.fn();

        const { rerender } = render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={0}
                onSaved={onSaved}
            />
        );
        rerender(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={1}
                onSaved={onSaved}
            />
        );

        await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ok: false, conflictField: "name" }));
        expect(saveAgreement).not.toHaveBeenCalled();
    });

    it("reports the error via onSaved when saveAgreement rejects", async () => {
        const error = new Error("boom");
        const saveAgreement = vi.fn().mockRejectedValue(error);
        const verifyUniquenessBeforeSubmit = vi.fn().mockResolvedValue(null);
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: false,
            saveAgreement,
            verifyUniquenessBeforeSubmit
        });
        const onSaved = vi.fn();

        const { rerender } = render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={0}
                onSaved={onSaved}
            />
        );
        rerender(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
                saveTrigger={1}
                onSaved={onSaved}
            />
        );

        await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ok: false, error }));
    });

    it("renders the Grant Details block when isGrant is true", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: true,
            isGrant: true,
            agreementType: "GRANT",
            selectedAgreementFilter: "GRANT"
        });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
            />
        );

        expect(screen.getByText("Grant Details")).toBeInTheDocument();
    });

    it("does not render the Grant Details block for non-grant agreements", () => {
        useAgreementEditForm.mockReturnValue({
            ...baseHookState,
            isWizardMode: true,
            isGrant: false,
            agreementType: "CONTRACT",
            selectedAgreementFilter: "CONTRACT"
        });

        render(
            <AgreementEditForm
                isEditMode={true}
                setIsEditMode={vi.fn()}
            />
        );

        expect(screen.queryByText("Grant Details")).not.toBeInTheDocument();
    });
});
