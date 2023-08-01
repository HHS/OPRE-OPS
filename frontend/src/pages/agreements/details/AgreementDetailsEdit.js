import PropTypes from "prop-types";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { useNavigate } from "react-router-dom";

/**
 * Renders the edit-mode of an agreement
 * @param {object} props - The component props.
 * @param {object} props.agreement - The agreement object to display details for.
 * @param {object} props.projectOfficer - The project officer object for the agreement.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetailsEdit = ({ agreement, projectOfficer }) => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const goToNext = () => {
        window.location = `/agreements/${agreement.id}`;
    };
    const isEditMode = true;
    const isReviewMode = false;

    return (
        <div>
            <EditAgreementProvider agreement={agreement} projectOfficer={projectOfficer}>
                <AgreementEditForm
                    goBack={goBack}
                    goToNext={goToNext}
                    isEditMode={isEditMode}
                    isReviewMode={isReviewMode}
                />
            </EditAgreementProvider>
        </div>
    );
};

AgreementDetailsEdit.propTypes = {
    agreement: PropTypes.object.isRequired,
    projectOfficer: PropTypes.object.isRequired,
};
export default AgreementDetailsEdit;
