import { render } from "@testing-library/react";
import { CreateBudgetLineFlow } from "./CreateBudgetLineFlow";

describe("CreateBudgetLineFlow", () => {
    it("renders without errors", () => {
        render(<CreateBudgetLineFlow />);
    });
});
