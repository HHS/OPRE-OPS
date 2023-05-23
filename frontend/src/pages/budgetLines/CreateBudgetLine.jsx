import React from "react";
import { useDispatch } from "react-redux";
import CreateBudgetLineFlow from "./CreateBudgetLineFlow";
import { setProcurementShop } from "./createBudgetLineSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "../../components/UI/WizardSteps/StepCreateBudgetLines";
import StepSuccess from "./StepSuccess";
import { useBudgetLines } from "./budgetLineContext";

export const CreateBudgetLine = () => {
    const dispatch = useDispatch();
    const {
        wizardSteps,
        selected_project: selectedProject,
        selected_agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
        existing_budget_lines: existingBudgetLines,
    } = useBudgetLines();

    // Get initial list of Agreements (dependent on Research Project Selection)
    // useEffect(() => {
    //     const getAgreementsAndSetState = async () => {
    //         if (selectedProject?.id > 0) {
    //             const agreements = await getAgreementsByResearchProjectFilter(selectedProject?.id);
    //             dispatch(setAgreements(agreements));
    //         }
    //     };

    //     getAgreementsAndSetState().catch(console.error);

    //     return () => {
    //         dispatch(setAgreements([]));
    //     };
    // }, [dispatch, selectedProject]);
    // TODO: replace with RTK Query, this is used in the StepCreateBudgetLines component
    React.useEffect(() => {
        const getProcurementShopsAndSetState = async () => {
            const results = await getProcurementShopList();
            dispatch(setProcurementShop(results));
        };
        getProcurementShopsAndSetState().catch(console.error);
    }, [dispatch]);

    // useEffect(() => {
    //     const getAgreementsAndSetState = async () => {
    //         if (selectedProject?.id > 0) {
    //             const results = await getAgreementsByResearchProjectFilter(selectedProject?.id);
    //             dispatch(setAgreements(results));
    //         }
    //     };
    //     getAgreementsAndSetState().catch(console.error);
    // }, [dispatch, selectedProject]);

    return (
        <CreateBudgetLineFlow>
            <StepSelectProjectAndAgreement />
            <StepCreateBudgetLines
                wizardSteps={wizardSteps}
                currentStep={2}
                selectedResearchProject={selectedProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                existingBudgetLines={existingBudgetLines}
            />
            <StepSuccess />
        </CreateBudgetLineFlow>
    );
};

export default CreateBudgetLine;
