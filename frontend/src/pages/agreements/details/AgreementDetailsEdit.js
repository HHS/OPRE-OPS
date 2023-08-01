//

import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { useNavigate } from "react-router-dom";

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

export default AgreementDetailsEdit;
