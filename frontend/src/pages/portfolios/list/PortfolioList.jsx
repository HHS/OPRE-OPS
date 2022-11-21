import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import App from "../../../App";
import { BreadcrumbList, BreadcrumbItem } from "../../../components/Header/Breadcrumb";
import { getPortfolioList } from "./getPortfolioList";
import styles from "./styles.module.css";

const PortfolioList = () => {
    const dispatch = useDispatch();
    const portfolioList = useSelector((state) => state.portfolioList.portfolios);

    const tableClasses = `usa-table usa-table--borderless ${styles.center}`;

    useEffect(() => {
        dispatch(getPortfolioList());
    }, [dispatch]);

    return (
        <App>
            <header>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="Portfolios" />
                </BreadcrumbList>
            </header>
            <h1 className={styles.centerText}>Portfolios</h1>
            <nav>
                <table className={tableClasses}>
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
            </nav>

            <Outlet />
        </App>
    );
};

export default PortfolioList;
