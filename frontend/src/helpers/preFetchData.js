import { getAllResearchProjects } from "../api/getResearchProjects";
import { setResearchProjectsList as budgetProjects } from "../pages/budgetLines/createBudgetLineSlice";
import { setResearchProjectsList as agreementProjects } from "../pages/agreements/createAgreementSlice";
import { useDispatch, useSelector } from "react-redux";

const GetCreateBudgetLineResearchProjectsListAndSetState = async () => {
    const dispatch = useDispatch();
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects_list);
    if (!researchProjects.length > 0) {
        const projects = await getAllResearchProjects();
        dispatch(budgetProjects(projects));
        dispatch(agreementProjects(projects));
    }
};

export const loadPreFetchedData = () => {
    GetCreateBudgetLineResearchProjectsListAndSetState();
};
