import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import App from "../../../App";
import { getPortfolioList } from "./getPortfolioList";

const PortfolioList = () => {
    const dispatch = useDispatch();
    const portfolioList = useSelector((state) => state.portfolioList.portfolios);

    const tableClasses = "usa-table usa-table--borderless margin-x-auto";

    useEffect(() => {
        dispatch(getPortfolioList());
    }, [dispatch]);

    return (
        <App>
            <h1 className="text-center">Portfolios</h1>
            <nav>
                <table className={tableClasses}>
                    <caption>List of all Portfolios</caption>
                    <thead>
                        <tr>
                            <th scope="col">name</th>
                            <th scope="col">status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolioList.map((portfolio) => (
                            <tr key={portfolio.id}>
                                <th scope="row">
                                    <Link to={"./" + portfolio.id}>{portfolio.name}</Link>
                                </th>
                                <td>{portfolio.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </nav>

            <Outlet />
        </App>
    );
};

export default PortfolioList;
