import App from "../../App";
import { BudgetLinesProvider } from "./budgetLineContext";
import CreateBudgetLine from "./CreateBudgetLine";

const CreateBudgetLines = () => {
    return (
        <App>
            <BudgetLinesProvider>
                <CreateBudgetLine />
            </BudgetLinesProvider>
        </App>
    );
};

export default CreateBudgetLines;
