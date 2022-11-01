import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import { BreadcrumbItem, BreadcrumbList } from "../../../components/Header/Breadcrumb";
import { getCanList } from "./getCanList";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    useEffect(() => {
        dispatch(getCanList());
    }, [dispatch]);

    return (
        <>
            <header>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="CANs" />
                </BreadcrumbList>
            </header>

            <main>
                <h1>CANs</h1>
                <nav>
                    <table className="usa-table usa-table--borderless">
                        <caption>List of all CANs</caption>
                        <thead>
                            <tr>
                                <th scope="col">number</th>
                                <th scope="col">description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canList.map((can) => (
                                <tr key={can.id}>
                                    <th scope="row">
                                        <Link to={"./" + can.id}>{can.number}</Link>
                                    </th>
                                    <td>{can.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </nav>

                <Outlet />
            </main>
        </>
    );
};

export default CanList;
