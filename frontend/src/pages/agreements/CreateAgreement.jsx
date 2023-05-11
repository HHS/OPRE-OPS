import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { setUsers } from "./createAgreementSlice";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import { StepCreateBudgetLines } from "./StepCreateBudgetLines";
import { getUsers } from "../../api/getUser";
import App from "../../App";
import StepAgreementSuccess from "./StepAgreementSuccess";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const getUsersAndSetState = async () => {
            const results = await getUsers();
            dispatch(setUsers(results));
        };
        getUsersAndSetState().catch(console.error);
    }, [dispatch]);

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
