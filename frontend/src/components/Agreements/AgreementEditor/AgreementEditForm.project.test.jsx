import { render, screen } from "@testing-library/react";
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
vi.mock("../ProductServiceCodeSummaryBox", () => ({ default: () => <div /> }));
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
});
