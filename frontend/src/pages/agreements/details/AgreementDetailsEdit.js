//

import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { useNavigate } from "react-router-dom";

const AgreementDetailsEdit = ({ agreement, projectOfficer, isEditMode, setIsEditMode }) => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const goToNext = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const isReviewMode = false;

    return (
        <div>
            <EditAgreementProvider agreement={agreement} projectOfficer={projectOfficer}>
                <AgreementEditForm
                    goBack={goBack}
                    goToNext={goToNext}
                    isReviewMode={isReviewMode}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                />
            </EditAgreementProvider>
        </div>
    );
};

export default AgreementDetailsEdit;
