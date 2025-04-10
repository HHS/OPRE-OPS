import { Link } from "react-router-dom";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Card from "../../../components/UI/Cards/Card";

/**
 * @typedef {import("../../../components/Portfolios/PortfolioTypes").Portfolio} Portfolio
 * @typedef {import("../../../components/Portfolios/PortfolioTypes").Division} Division
 */

/**
 * Component that displays a list of portfolios grouped by division
 * @returns {JSX.Element} The rendered component
 */
const PortfolioList = () => {
    const { data: portfolios, isLoading } = useGetPortfoliosQuery({});

    /** @type {Record<string, Portfolio[]>} */
    const porfolioListGroupedByDivision = portfolios?.reduce((acc, portfolio) => {
        const division = portfolio.division.name;
        if (!acc[division]) {
            acc[division] = [];
        }
        acc[division].push(portfolio);
        return acc;
    }, {});

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <App breadCrumbName="Portfolios">
            <h1 className="margin-0 text-brand-primary font-sans-2xl">Portfolios</h1>

            {Object.keys(porfolioListGroupedByDivision).map((division) => (
                <section key={division}>
                    <h2 className="font-12px text-base-dark">{division}</h2>
                    {porfolioListGroupedByDivision[division].map((portfolio) => (
                        <Link
                            key={portfolio.id}
                            to={`/portfolios/${portfolio.id}/spending`}
                        >
                            <Card>
                                <h3 className="font-sans-lg">{portfolio.name}</h3>
                            </Card>
                        </Link>
                    ))}
                </section>
            ))}
        </App>
    );
};

export default PortfolioList;
