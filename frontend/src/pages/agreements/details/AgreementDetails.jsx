import PropTypes from "prop-types";
import AgreementDetailHeader from "../../../components/Agreements/AgreementDetailHeader";
import AgreementDetailsView from "./AgreementDetailsView";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import { hasBlIsInReview } from "../../../helpers/budgetLines.helpers";

/**
 * Renders the details of an agreement, including budget lines, spending, and other information.
 * @param {object} props - The component props.
 * @param {object} props.agreement - The agreement object to display details for.
 * @param {function} props.setHasAgreementChanged - The function to set the agreement changed state.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetails = ({ agreement, setHasAgreementChanged, projectOfficer, isEditMode, setIsEditMode }) => {
    // eslint-disable-next-line no-unused-vars
    let { budget_line_items: _, ...agreement_details } = agreement;
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementInReview = hasBlIsInReview(agreement?.budget_line_items);
    const isEditable = isAgreementEditable && canUserEditAgreement && !isAgreementInReview;

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
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                />
            ) : (
                <AgreementDetailsView
                    agreement={agreement}
                    projectOfficer={projectOfficer}
                />
            )}
        </article>
    );
};

AgreementDetails.propTypes = {
    agreement: PropTypes.object.isRequired,
    setHasAgreementChanged: PropTypes.func.isRequired,
    projectOfficer: PropTypes.object.isRequired,
    isEditMode: PropTypes.bool.isRequired,
    setIsEditMode: PropTypes.func.isRequired
};

export default AgreementDetails;
