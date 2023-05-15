import React from "react";
import { useDispatch } from "react-redux";
import App from "../../App";
import CreateBudgetLineFlow from "./CreateBudgetLineFlow";
// import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import { setProcurementShop } from "./createBudgetLineSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "./StepCreateBudgetLines";
import StepSuccess from "./StepSuccess";
import { BudgetLinesProvider } from "./budgetLineContext";

export const CreateBudgetLine = () => {
    const dispatch = useDispatch();

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
        <App>
            <BudgetLinesProvider>
                <CreateBudgetLineFlow>
                    <StepSelectProjectAndAgreement />
                    <StepCreateBudgetLines />
                    <StepSuccess />
                </CreateBudgetLineFlow>
            </BudgetLinesProvider>
        </App>
    );
};
