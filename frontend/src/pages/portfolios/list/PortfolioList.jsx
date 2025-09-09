import { Link, useNavigate } from "react-router-dom";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Card from "../../../components/UI/Cards/Card";
import { groupByDivision } from "./PortfolioList.helpers";

/**
 * @typedef {import("../../../types/PortfolioTypes").Portfolio} Portfolio
 * @typedef {import("../../../types/PortfolioTypes").Division} Division
 */

/**
 * @component that displays a list of portfolios grouped by division
 * @returns {React.ReactElement} The rendered component
 */
const PortfolioList = () => {
    const navigate = useNavigate();
    const NUM_OF_COLUMNS = 3;
    const { data: portfolios, isLoading, isError } = useGetPortfoliosQuery({});

    /** @type {Record<string, Portfolio[]>} */
    const portfolioListGroupedByDivision = groupByDivision(portfolios);

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (isError) {
        navigate("/error");
    }

    return (
        <App breadCrumbName="Portfolios">
            <h1 className="margin-0 margin-bottom-4 text-brand-primary font-sans-2xl">Portfolios</h1>

            {Object.keys(portfolioListGroupedByDivision).map((division) => (
                <section
                    className="margin-bottom-6"
                    key={division}
                >
                    <h2 className="font-12px text-base-dark margin-bottom-2 text-normal">{division}</h2>

                    <div className="grid-row grid-gap">
                        {portfolioListGroupedByDivision[division].map((portfolio, index) => (
                            <Link
                                key={portfolio.id}
                                to={`/portfolios/${portfolio.id}/spending`}
                                className={`text-no-underline grid-col-4 ${index >= NUM_OF_COLUMNS ? "margin-top-2" : ""}`}
                            >
                                <Card
                                    style={{
                                        width: "300px",
                                        minHeight: "100px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "start",
                                        padding: "10px 30px"
                                    }}
                                >
                                    <h3 className="font-sans-lg text-brand-primary margin-0 text-center">
                                        {portfolio.name}
                                    </h3>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </App>
    );
};

export default PortfolioList;
