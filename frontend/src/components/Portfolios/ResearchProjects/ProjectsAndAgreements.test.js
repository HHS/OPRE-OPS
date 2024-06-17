import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../../../store";
import ProjectsAndAgreements from "./ProjectsAndAgreements";

const portfolioId = 1;
const numberOfProjects = 100;
const numOfResearchProjects = 2;
const numOfAdminAndSupportProjects = 5;

it("renders without crashing", () => {
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
