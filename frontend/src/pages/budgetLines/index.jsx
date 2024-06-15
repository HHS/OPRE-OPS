import App from "../../App";
import { BudgetLinesProvider } from "./BudgetLineContext";
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
