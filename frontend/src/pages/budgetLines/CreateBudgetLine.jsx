import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import App from "../../App";
import CreateBudgetLineFlow from "./CreateBudgetLineFlow";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import { setAgreements, setProcurementShop } from "./createBudgetLineSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "./StepCreateBudgetLines";
import StepSuccess from "./StepSuccess";

export const CreateBudgetLine = () => {
    const dispatch = useDispatch();
    // const selectedProject = useSelector((state) => state.createBudgetLine.selected_project);
    const wizardSteps = ["Project & Agreement", "Budget Lines", "Review"];
    const [selectedProject, setSelectedProject] = useState({});
    const [selectedAgreement, setSelectedAgreement] = useState({});
    const [selectedProcurementShop, setSelectedProcurementShop] = useState({});
    const [budgetLinesAdded, setBudgetLinesAdded] = useState([{}]);
    // Get initial list of Agreements (dependent on Research Project Selection)
    useEffect(() => {
        const getAgreementsAndSetState = async () => {
            if (selectedProject?.id > 0) {
                const agreements = await getAgreementsByResearchProjectFilter(selectedProject?.id);
                dispatch(setAgreements(agreements));
            }
        };

        getAgreementsAndSetState().catch(console.error);

        return () => {
            dispatch(setAgreements([]));
        };
    }, [dispatch, selectedProject]);

    useEffect(() => {
        const getProcurementShopsAndSetState = async () => {
            const results = await getProcurementShopList();
            dispatch(setProcurementShop(results));
        };
        getProcurementShopsAndSetState().catch(console.error);
    }, [dispatch]);

    useEffect(() => {
        const getAgreementsAndSetState = async () => {
            if (selectedProject?.id > 0) {
                const results = await getAgreementsByResearchProjectFilter(selectedProject?.id);
                dispatch(setAgreements(results));
            }
        };
        getAgreementsAndSetState().catch(console.error);
    }, [dispatch, selectedProject]);

    return (
        <App>
            <CreateBudgetLineFlow>
                <StepSelectProjectAndAgreement
                    wizardSteps={wizardSteps}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                    selectedAgreement={selectedAgreement}
                    setSelectedAgreement={setSelectedAgreement}
                    setSelectedProcurementShop={setSelectedProcurementShop}
                    setBudgetLinesAdded={setBudgetLinesAdded}
                />
                <StepCreateBudgetLines
                    wizardSteps={wizardSteps}
                    selectedProject={selectedProject}
                    selectedAgreement={selectedAgreement}
                    selectedProcurementShop={selectedProcurementShop}
                    setSelectedProcurementShop={setSelectedProcurementShop}
                    budgetLinesAdded={budgetLinesAdded}
                    setBudgetLinesAdded={setBudgetLinesAdded}
                />
                <StepSuccess />
            </CreateBudgetLineFlow>
        </App>
    );
};
