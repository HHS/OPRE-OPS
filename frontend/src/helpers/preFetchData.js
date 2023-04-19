import { getAllResearchProjects } from "../api/getResearchProjects";
import { setResearchProjects } from "../pages/budgetLines/createBudgetLineSlice";
import { useDispatch, useSelector } from "react-redux";
import { CheckAuth } from "../components/Auth/auth";

const GetCreateBudgetLineResearchProjectsAndSetState = async () => {
    const dispatch = useDispatch();
    const researchProjects = useSelector((state) => state.createBudgetLine.research_projects);
    if (!researchProjects.length > 0) {
        const projects = await getAllResearchProjects();
        dispatch(setResearchProjects(projects));
    }
};

export const loadPreFetchedData = () => {
    if (CheckAuth()) {
        GetCreateBudgetLineResearchProjectsAndSetState();
    }
};
