import App from "../../App";
import { EditAgreementProvider } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateEditAgreement from "./CreateEditAgreement";

const CreateAgreements = () => {
    return (
        <App>
            <EditAgreementProvider>
                <CreateEditAgreement />
            </EditAgreementProvider>
        </App>
    );
};

export default CreateAgreements;
