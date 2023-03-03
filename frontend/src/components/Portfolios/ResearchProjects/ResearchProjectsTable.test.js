import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import ResearchProjectsTable from "./ResearchProjectsTable";
import { data } from "./data";

const fiscalYear = "2023";

it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <ResearchProjectsTable fiscalYear={fiscalYear} data={data} />
        </Provider>
    );
});
