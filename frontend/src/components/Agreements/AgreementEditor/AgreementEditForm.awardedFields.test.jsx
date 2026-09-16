import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgreementEditForm from "./AgreementEditForm";
import useAgreementEditForm from "./AgreementEditForm.hooks";

// Component-level guard for issue #6144 AC 6/7: on an awarded agreement, the Title input is
// locked but the Nickname input must remain editable. isFieldDisabled unit tests already pin
// the underlying logic (AgreementEditForm.helpers.test.js); this test pins the actual rendered
// <input disabled> attribute so a future edit that wires isDisabled onto the nickname Input
// (or adds "nick_name" to an immutable-fields list) fails a fast test instead of shipping silently.
vi.mock("./AgreementEditForm.hooks", () => ({
    default: vi.fn()
}));

vi.mock("../../ServicesComponents/ContractTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../ServicesComponents/ServiceReqTypeSelect", () => ({ default: () => <div /> }));
vi.mock("../../UI/Button/GoBackButton", () => ({ default: () => <div /> }));
vi.mock("../../UI/Cards/DefinitionListCard", () => ({ default: () => <div /> }));
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
vi.mock("../../Projects/ProjectComboBox", () => ({ default: () => <div /> }));

const baseHookState = {
    cn: () => "",
    isWizardMode: true,
    isAgreementCreated: false,
    agreement: { id: undefined },
    agreementNotes: "",
    agreementVendor: "",
    agreementType: "CONTRACT",
    agreementTitle: "Some Awarded Agreement Title",
    agreementNickName: "SOME-NICK",
    agreementDescription: "",
    agreementReason: "NEW_REQ",
    selectedTeamMembers: [],
    projects: [],
    selectedProject: null,
    contractType: "",
    serviceReqType: "",
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
    // The awarded-lock: "name" is immutable, "nick_name" is deliberately absent from every
    // immutable-fields list on both sides of the stack (backend and frontend) — see B11/AC6.
    immutableFields: ["name"],
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
    showBlockerModal: false,
    setShowBlockerModal: vi.fn(),
    blockerModalProps: {},
    saveAgreement: vi.fn(),
    isLoadingProductServiceCodes: false,
    isLoadingProjects: false
};

describe("AgreementEditForm awarded-agreement field locking (issue #6144 AC 6/7)", () => {
    it("disables the Title input but keeps the Nickname input enabled on an awarded agreement", () => {
        useAgreementEditForm.mockReturnValue(baseHookState);

        render(
            <AgreementEditForm
                isEditMode={false}
                isAgreementAwarded={true}
            />
        );

        const titleInput = screen.getByLabelText(/Agreement Title/i);
        const nicknameInput = screen.getByLabelText(/Agreement Nickname or Acronym/i);

        expect(titleInput).toBeDisabled();
        expect(nicknameInput).not.toBeDisabled();
    });

    it("keeps both the Title and Nickname inputs enabled when the agreement is not awarded", () => {
        useAgreementEditForm.mockReturnValue({ ...baseHookState, immutableFields: [] });

        render(
            <AgreementEditForm
                isEditMode={false}
                isAgreementAwarded={false}
            />
        );

        const titleInput = screen.getByLabelText(/Agreement Title/i);
        const nicknameInput = screen.getByLabelText(/Agreement Nickname or Acronym/i);

        expect(titleInput).not.toBeDisabled();
        expect(nicknameInput).not.toBeDisabled();
    });
});
