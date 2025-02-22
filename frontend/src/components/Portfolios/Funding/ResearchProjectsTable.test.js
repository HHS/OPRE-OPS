import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "../../../store";
import ResearchProjectsTable from "./ResearchProjectsTable";
import { data } from "./data";

const fiscalYear = "2023";

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <ResearchProjectsTable
                    fiscalYear={fiscalYear}
                    data={data}
                />
            </BrowserRouter>
        </Provider>
    );
});
