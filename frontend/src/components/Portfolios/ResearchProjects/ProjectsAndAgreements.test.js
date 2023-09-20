import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import ProjectsAndAgreements from "./ProjectsAndAgreements";

const portfolioId = 1;
const numberOfProjects = 100;
const numOfResearchProjects = 2;
const numOfAdminAndSupportProjects = 5;

it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <ProjectsAndAgreements
                portfolioId={portfolioId}
                numberOfProjects={numberOfProjects}
                numOfResearchProjects={numOfResearchProjects}
                numOfAdminAndSupportProjects={numOfAdminAndSupportProjects}
            />
        </Provider>
    );
});
