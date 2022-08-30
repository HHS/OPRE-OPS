import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import { getPortfolioList } from "./getPortfolioList";
import { useEffect } from "react";

const PortfolioList = () => {
    const dispatch = useDispatch();
    const portfolioList = useSelector((state) => state.portfolioList.portfolios);

    useEffect(() => {
        dispatch(getPortfolioList());
    }, [dispatch]);

    return (
        <>
            <main>
                <nav className="usa-breadcrumb" aria-label="Breadcrumbs,,">
                    <ol className="usa-breadcrumb__list">
                        <li className="usa-breadcrumb__list-item">
                            <Link to="/" className="usa-breadcrumb__link">
                                Home
                            </Link>
                        </li>
                        <li className="usa-breadcrumb__list-item">
                            <Link to="/portfolios" className="usa-breadcrumb__link">
                                Portfolios
                            </Link>
                        </li>
                    </ol>
                </nav>
                <table id="portfolio-list">
                    <caption>List of all Portfolios</caption>
                    <tbody>
                        <tr>
                            <th>name</th>
                            <th>status</th>
                            <th>description</th>
                        </tr>
                        {portfolioList.map((portfolio) => (
                            <tr key={portfolio.id}>
                                <td>
                                    <Link to={"./" + portfolio.id}>{portfolio.name}</Link>
                                </td>
                                <td>{portfolio.status}</td>
                                <td>{portfolio.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <Outlet />
        </>
    );
};

export default PortfolioList;
