import App from "../../App";
import { CreateAgreementProvider } from "./CreateAgreementContext";
import CreateAgreement from "./CreateAgreement";

const CreateAgreements = () => {
    return (
        <App>
            <CreateAgreementProvider>
                <CreateAgreement />
            </CreateAgreementProvider>
        </App>
    );
};

export default CreateAgreements;
