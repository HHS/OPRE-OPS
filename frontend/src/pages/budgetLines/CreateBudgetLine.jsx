import App from "../../App";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";
import { getAgreementsByResearchProjectFilter } from "../../api/getAgreements";
import { setAgreements, setProcurementShop } from "./createBudgetLineSlice";
import { getProcurementShopList } from "../../api/getProcurementShopList";
import StepSelectProjectAndAgreement from "./StepSelectProjectAndAgreement";
import StepCreateBudgetLines from "./StepCreateBudgetLines";
const wizardSteps = ["Project", "Agreement", "Budget Lines"];

const StepThree = ({ goBack, goToNext }) => (
    <>
        <h2 className="font-sans-lg">Create New Budget Line</h2>
        <p>Step Three: Text explaining this page</p>
        <StepIndicator steps={["Project & Agreement", "Budget Lines", "Review"]} currentStep={3} />
        <div className="grid-row flex-justify-end">
            <button className="usa-button usa-button--unstyled" onClick={() => goBack()}>
                Back
            </button>
            <button className="usa-button" onClick={() => goToNext()}>
                Continue
            </button>
        </div>
    </>
);

export const CreateBudgetLine = () => {
    const dispatch = useDispatch();
    const selectedProject = useSelector((state) => state.createBudgetLine.selected_project);

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
            <CreateBudgetLineFlow
            // onFinish={(data) => {
            //     console.log("budget line has: " + JSON.stringify(data, null, 2));
            //     alert("Budget Line Created!");
            // }}
            >
                <StepSelectProjectAndAgreement wizardSteps={wizardSteps} />
                <StepCreateBudgetLines wizardSteps={wizardSteps} />
                <StepThree />
            </CreateBudgetLineFlow>
        </App>
    );
};
