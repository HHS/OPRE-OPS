import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import AdminAndSupportProjectsTable from "./AdminAndSupportProjectsTable";
import { data } from "./data";

const fiscalYear = "2023";

it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <AdminAndSupportProjectsTable
                fiscalYear={fiscalYear}
                data={data}
            />
        </Provider>
    );
});
