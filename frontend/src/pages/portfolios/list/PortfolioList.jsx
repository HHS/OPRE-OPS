import { Link } from "react-router-dom";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Card from "../../../components/UI/Cards/Card";

/**
 * @typedef {import("../../../types/PortfolioTypes").Portfolio} Portfolio
 * @typedef {import("../../../types/PortfolioTypes").Division} Division
 */

/**
 * Component that displays a list of portfolios grouped by division
 * @returns {JSX.Element} The rendered component
 */
const PortfolioList = () => {
    const { data: portfolios, isLoading } = useGetPortfoliosQuery({});

    /** @type {Record<string, Portfolio[]>} */
    const portfolioListGroupedByDivision = portfolios?.reduce((acc, portfolio) => {
        const division = portfolio.division.name;
        if (!acc[division]) {
            acc[division] = [];
        }
        acc[division].push(portfolio);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
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
                        {portfolioListGroupedByDivision[division].map((portfolio) => (
                            <Link
                                key={portfolio.id}
                                to={`/portfolios/${portfolio.id}/spending`}
                                className="text-no-underline grid-col-4"
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
