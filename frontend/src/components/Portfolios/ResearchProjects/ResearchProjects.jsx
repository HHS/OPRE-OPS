import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line import/named
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { Link, useParams } from "react-router-dom";
// eslint-disable-next-line import/named
import { getResearchProjects } from "../../../pages/portfolios/detail/getResearchProjects";
import ResearchBudgetVsSpending from "./ResearchBudgetVsSpending";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const portfolio = useSelector((state) => state.portfolioBudgetSummary.portfolio);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);
    const researchProjects = useSelector((state) => state.portfolio.researchProjects);
    const data = [
        {
            id: 1,
            name: "Center for Research on Learning and Teaching",
            type: "research",
            funding: "6000000",
            fundingToDate: "1900000",
            firstAwardDate: "2018-01-01",
            cans: 3,
            agreement: "Grant",
        },
        {
            id: 2,
            name: "Project Two that is kinda long",
            type: "research",
            funding: "8000000",
            fundingToDate: "1000000",
            firstAwardDate: "2020-01-01",
            cans: 2,
            agreement: "Mixed",
        },
        {
            id: 3,
            name: "Project Three that is kinda long",
            type: "research",
            funding: "1000000",
            fundingToDate: "0",
            firstAwardDate: "2022-01-01",
            cans: 1,
            agreement: "Contract",
        },
        {
            id: 4,
            name: "OPRE Website Development",
            type: "admin_and_support",
            funding: "1000000",
            fundingToDate: "0",
            firstAwardDate: "2022-01-01",
            cans: 4,
            agreement: "Contract",
        },
        {
            id: 5,
            name: "OPRE OPS",
            type: "admin_and_support",
            funding: "0",
            fundingToDate: "1000000",
            firstAwardDate: "2022-01-01",
            cans: 5,
            agreement: "Contract",
        },
    ];
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
            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
            <div className="display-flex flex-justify">
                <ResearchBudgetVsSpending portfolioId={portfolioId} />
            </div>
            {researchProjects.length > 0 && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <p>There are no Research Projects.</p>}
        </section>
    );
};

export default ResearchProjects;
