import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import AgreementDetailsView from "./AgreementDetailsView";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import { hasBlIsInReview } from "../../../helpers/budgetLines.helpers";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {import("../../../components/Agreements/AgreementTypes").Agreement} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @param {object} props.alternateProjectOfficer - The project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {boolean} props.isAgreementNotaContract - Whether the agreement is not a contract.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetails = ({
    agreement,
    setHasAgreementChanged,
    projectOfficer,
    alternateProjectOfficer,
    isEditMode,
    setIsEditMode,
    isAgreementNotaContract
}) => {
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    const canUserEditAgreement = agreement?._meta.isEditable;
    const isAgreementInReview = hasBlIsInReview(agreement?.budget_line_items || []);
    const isEditable = canUserEditAgreement && !isAgreementInReview && !isAgreementNotaContract;
    return (
        <article>
            <AgreementDetailHeader
                heading="Agreement Details"
                details=""
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isEditable={isEditable}
            />

            {isEditMode ? (
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
                />
            )}
        </article>
    );
};

export default AgreementDetails;
