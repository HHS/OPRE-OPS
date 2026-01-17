import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import { useIsUserSuperUser } from "../../../hooks/user.hooks";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import AgreementDetailsView from "./AgreementDetailsView";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {import("../../../types/UserTypes").SafeUser} props.projectOfficer - The project officer object for the agreement.
 * @param {import("../../../types/UserTypes").SafeUser} props.alternateProjectOfficer - The alternate project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotDeveloped - Whether the agreement is not yet developed.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} [props.isAgreementAwarded] - if the agreement is awarded
 * @param {boolean} [props.hasAgreementChanged] - if the agreement properties has changed
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementDetails = ({
    agreement,
    setHasAgreementChanged,
    projectOfficer,
    alternateProjectOfficer,
    isEditMode,
    setIsEditMode,
    isAgreementNotDeveloped,
    isAgreementAwarded = false,
    hasAgreementChanged = false
}) => {
    const isSuperUser = useIsUserSuperUser();
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    const isEditable = isSuperUser || (agreement?._meta.isEditable && !isAgreementNotDeveloped);
    const isCreatingAgreement = location.pathname === "/agreements/create";
    const isEditingAgreement = location.pathname.startsWith("/agreements/edit");
    const isWizardMode = isCreatingAgreement || isEditingAgreement;

    return (
        <article>
            <AgreementDetailHeader
                heading={isWizardMode ? "Agreement Details" : "Edit Agreement Details"}
                details=""
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={isEditable}
                hasUnsavedChanges={hasAgreementChanged}
            />

            {isEditMode && isEditable ? (
                <AgreementDetailsEdit
                    agreement={agreement}
                    setHasAgreementChanged={setHasAgreementChanged}
                    projectOfficer={projectOfficer}
                    alternateProjectOfficer={alternateProjectOfficer}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                />
            ) : (
                <AgreementDetailsView
                    agreement={agreement}
                    projectOfficer={projectOfficer}
                    alternateProjectOfficer={alternateProjectOfficer}
                    isAgreementAwarded={isAgreementAwarded}
                />
            )}
        </article>
    );
};

export default AgreementDetails;
