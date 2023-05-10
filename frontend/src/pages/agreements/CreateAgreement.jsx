import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { setProcurementShopsList, setUsers } from "./createAgreementSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import { StepCreateBudgetLines } from "./StepCreateBudgetLines";
import { getUsers } from "../../api/getUser";
import App from "../../App";
import StepAgreementSuccess from "./StepAgreementSuccess";

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
            <CreateAgreementFlow>
                <StepSelectProject wizardSteps={wizardSteps} />
                <StepCreateAgreement wizardSteps={wizardSteps} />
                <StepCreateBudgetLines wizardSteps={wizardSteps} />
                <StepAgreementSuccess />
            </CreateAgreementFlow>
        </App>
    );
};
