import { useSelector, useDispatch } from "react-redux";
import App from "../../../App";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import DynamicSelector from "../../../components/UI/DynamicSelector/DynamicSelector";

const BudgetLineItemWizard = () => {
    const dispatch = useDispatch();
    const bliState = useSelector((state) => state.bli_flow);
    const urlPathParams = useParams();

    useEffect(() => {
        const setBliFlow = async () => {};
    }, [dispatch]);

    return (
        <>
            <App>
                <Breadcrumb currentName="Create Budget Line" />
                <h3>Create New Budget Line</h3>
                <p>Text explaining this page</p>
                <div>
                    <h2>[Wizard Progress Placeholder]</h2>
                    <p>[Step 1] ----- Step 2 ----- Step 3</p>
                </div>
                <h3>Select the Project and Agreement</h3>
                <p>
                    Select the project and agreement the budget line(s) should be associated with. You must select the
                    project before an agreement.
                </p>
                <DynamicSelector></DynamicSelector>
            </App>
        </>
    );
};

export default BudgetLineItemWizard;
