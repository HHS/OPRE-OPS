import App from "../../App";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { setProcurementShopsList, setUsers } from "./createAgreementSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import { StepCreateBudgetLines } from "./StepCreateBudgetLines";
import { getUsers } from "../../api/getUser";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    const dispatch = useDispatch();
    //const selectedProject = useSelector((state) => state.createBudgetLine.selectedProject);

    useEffect(() => {
        const getProcurementShopsAndSetState = async () => {
            const results = await getProcurementShopList();
            dispatch(setProcurementShopsList(results));
        };
        getProcurementShopsAndSetState().catch(console.error);
    }, [dispatch]);

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
            </CreateAgreementFlow>
        </App>
    );
};
