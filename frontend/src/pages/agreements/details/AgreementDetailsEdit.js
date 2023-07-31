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
            <div style={{ background: "#cccccc", border: "1px dashed #999999" }}>
                <h2>TEMP DEBUG</h2>
                <pre>{JSON.stringify(agreement, null, 2)}</pre>
            </div>
        </div>
    );
};

export default AgreementDetailsEdit;
