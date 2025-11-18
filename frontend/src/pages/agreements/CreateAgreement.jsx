import React from "react";
import App from "../../App";
import { EditAgreementProvider } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateEditAgreement from "./CreateEditAgreement";
import { useGetAgreementByIdQuery } from "../../api/opsAPI";

const CreateAgreement = () => {
    const [agreementId, setAgreementId] = React.useState(null);

    const { data: agreement } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });

    return (
        <App>
            <EditAgreementProvider>
                <CreateEditAgreement
                    budgetLines={agreement?.budget_line_items}
                    setAgreementId={setAgreementId}
                />
            </EditAgreementProvider>
        </App>
    );
};

export default CreateAgreement;
