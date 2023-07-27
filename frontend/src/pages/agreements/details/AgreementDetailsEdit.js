//

import {Link, useNavigate} from "react-router-dom";
import {EditAgreementProvider} from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import React from "react";

const AgreementDetailsEdit = ({ agreement, projectOfficer }) => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const goToNext = () => {
        navigate(`/agreements/${agreement.id}`);
    };
    const isEditMode = true;
    const isReviewMode = false;

    return (
        <div>
            <h2>Edit Agreement Metadata: The is a WIP, but you can still&nbsp;
                <Link to={"/agreements/edit/" + agreement.id + "?mode=edit"}>
                    <span className="text-primary">edit it in the wizard</span>
                </Link>
            </h2>
            <EditAgreementProvider agreement={agreement} projectOfficer={projectOfficer}>
                <AgreementEditForm
                    goBack={goBack} goToNext={goToNext} isEditMode={isEditMode} isReviewMode={isReviewMode}
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
