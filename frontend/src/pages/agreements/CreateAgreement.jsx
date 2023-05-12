import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import { StepCreateBudgetLines } from "./StepCreateBudgetLines";
import App from "../../App";
import StepAgreementSuccess from "./StepAgreementSuccess";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    return (
        <App>
            <CreateAgreementFlow
                onFinish={(data) => {
                    console.log("budget line has: " + JSON.stringify(data, null, 2));
                    alert("Budget Line Created!");
                }}
            >
                <StepSelectProject wizardSteps={wizardSteps} />
                <StepCreateAgreement wizardSteps={wizardSteps} />
                <StepCreateBudgetLines wizardSteps={wizardSteps} />
                <StepAgreementSuccess />
            </CreateAgreementFlow>
        </App>
    );
};
