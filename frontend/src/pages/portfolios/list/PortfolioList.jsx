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

            <table className="usa-table usa-table--borderless">
                <caption>List of all Portfolios</caption>
                <thead>
                    <tr>
                        <th scope="col">name</th>
                        <th scope="col">status</th>
                        <th scope="col">description</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolioList.map((portfolio) => (
                        <tr key={portfolio.id}>
                            <th scope="row">
                                <Link to={"./" + portfolio.id}>{portfolio.name}</Link>
                            </th>
                            <td>{portfolio.status}</td>
                            <td>{portfolio.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Outlet />
        </>
    );
};

export default PortfolioList;
