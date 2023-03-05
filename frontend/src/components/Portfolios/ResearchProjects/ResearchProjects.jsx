import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { getResearchProjects } from "../../../pages/portfolios/detail/getResearchProjects";
import ResearchBudgetVsSpending from "./ResearchBudgetVsSpending";
import ProjectsAndAgreements from "./ProjectsAndAgreements";
import ResearchProjectsTable from "./ResearchProjectsTable";
import AdminAndSupportProjectsTable from "./AdminAndSupportProjectsTable";
import { data } from "./data";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);
    const researchProjects = useSelector((state) => state.portfolio.researchProjects);
    const filteredResearchProjects = data.filter((project) => project.type === "research");
    const filteredAdminAndSupportProjects = data.filter((project) => project.type === "admin_and_support");
    const numberOfProjects = filteredResearchProjects.length + filteredAdminAndSupportProjects.length;

    // Comps
    const researchProjectData = researchProjects.map((rp) => (
        <li key={rp.id}>
            <Link to={`/research-projects/${rp.id}`}>{rp.title}</Link>
        </li>
    ));

    // Get ResearchProject data
    useEffect(() => {
        const getResearchProjectsAndSetState = async () => {
            const result = await getResearchProjects(portfolioId, fiscalYear.value);
            dispatch(setResearchProjects(result));
        };

        getResearchProjectsAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProjects([]));
        };
    }, [dispatch, fiscalYear, portfolioId]);

    return (
        <section>
            <h2 className="font-sans-lg">Projects & Spending Summary</h2>
            <p className="font-sans-sm">
                The summary below displays all active projects, spending and agreements within this portfolio for the
                selected fiscal year. An active project has active work happening. It might have funding from a previous
                fiscal year or no funding within the fiscal year.
            </p>

            <div className="display-flex flex-justify">
                <ResearchBudgetVsSpending portfolioId={portfolioId} />
                <ProjectsAndAgreements
                    portfolioId={portfolioId}
                    numberOfProjects={numberOfProjects}
                    numOfResearchProjects={filteredResearchProjects.length}
                    numOfAdminAndSupportProjects={filteredAdminAndSupportProjects.length}
                />
            </div>
            <article>
                <h2 className="font-sans-lg">Research Projects</h2>
                <p className="font-sans-sm">
                    This is a list of all active research projects that this portfolio contributes to for the selected
                    fiscal year.
                </p>
                <ResearchProjectsTable fiscalYear={fiscalYear} data={filteredResearchProjects} />
            </article>

            <article className="margin-top-4">
                <h2 className="font-sans-lg">Administrative & Support Projects</h2>
                <p className="font-sans-sm">
                    This is a list of all active administrative & support projects that this portfolio contributes to
                    for the selected fiscal year.
                </p>
                <AdminAndSupportProjectsTable fiscalYear={fiscalYear} data={filteredAdminAndSupportProjects} />
            </article>
            {/* NOTE: Not sure what to do with this */}
            {researchProjects.length > 0 && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <p>There are no Research Projects.</p>}
        </section>
    );
};

export default ResearchProjects;
