import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import { BreadcrumbList, BreadcrumbItem } from "../../UI/Breadcrumb";
import { getPortfolioList } from "./getPortfolioList";

const PortfolioList = () => {
    const dispatch = useDispatch();
    const portfolioList = useSelector((state) => state.portfolioList.portfolios);

    useEffect(() => {
        dispatch(getPortfolioList());
    }, [dispatch]);

    return (
        <>
            <BreadcrumbList>
                <BreadcrumbItem isCurrent pageName="Portfolios" />
            </BreadcrumbList>

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
