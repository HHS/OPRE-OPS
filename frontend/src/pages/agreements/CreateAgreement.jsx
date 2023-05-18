import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import App from "../../App";
import { CreateAgreementFlow } from "./CreateAgreementFlow";
import { setProcurementShopsList, setUsers } from "./createAgreementSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import { StepSelectProject } from "./StepSelectProject";
import { StepCreateAgreement } from "./StepCreateAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import { getUsers } from "../../api/getUser";
import StepAgreementSuccess from "./StepAgreementSuccess";

const wizardSteps = ["Project", "Agreement", "Budget Lines"];

export const CreateAgreement = () => {
    const dispatch = useDispatch();
    const selectedResearchProject = useSelector((state) => state.createAgreement.selected_project);
    const selectedAgreement = useSelector((state) => state.createAgreement.selected_agreement);
    const selectedProcurementShop = useSelector((state) => state.createAgreement.selected_procurement_shop);
    const budgetLinesAdded = useSelector((state) => state.createAgreement.budget_lines_added);

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
                <StepCreateBudgetLines
                    wizardSteps={wizardSteps}
                    currentStep={3}
                    selectedResearchProject={selectedResearchProject}
                    selectedAgreement={selectedAgreement}
                    selectedProcurementShop={selectedProcurementShop}
                    budgetLinesAdded={budgetLinesAdded}
                />
                <StepAgreementSuccess />
            </CreateAgreementFlow>
        </App>
    );
};
