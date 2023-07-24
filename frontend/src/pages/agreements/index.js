import App from "../../App";
import { CreateAgreementProvider } from "./CreateAgreementContext";
import CreateEditAgreement from "./CreateEditAgreement";

const CreateAgreements = () => {
    return (
        <App>
            <CreateAgreementProvider>
                <CreateEditAgreement />
            </CreateAgreementProvider>
        </App>
    );
};

export default CreateAgreements;
