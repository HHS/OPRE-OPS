import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import AgreementDetailsView from "./AgreementDetailsView";
import AgreementDetailsEdit from "./AgreementDetailsEdit";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {import("../../../types/UserTypes").SafeUser} props.projectOfficer - The project officer object for the agreement.
 * @param {import("../../../types/UserTypes").SafeUser} props.alternateProjectOfficer - The alternate project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotaContract - Whether the agreement is not a contract.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementDetails = ({
    agreement,
    setHasAgreementChanged,
    projectOfficer,
    alternateProjectOfficer,
    isEditMode,
    setIsEditMode,
    isAgreementNotaContract,
    teamLeaders,
    divisionDirectors
}) => {
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    const isEditable = agreement?._meta.isEditable && !isAgreementNotaContract;
    return (
        <article>
            <AgreementDetailHeader
                heading="Agreement Details"
                details=""
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={isEditable}
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
                    isAgreementNotaContract={isAgreementNotaContract}
                    divisionDirectors={divisionDirectors}
                    teamLeaders={teamLeaders}
                />
            )}
        </article>
    );
};

export default AgreementDetails;
