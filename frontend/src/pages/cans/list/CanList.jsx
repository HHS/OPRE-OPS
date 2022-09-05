import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import BreadcrumbItem from "../../UI/BreadcrumbItem";
import Breadcrumb from "../../UI/BreadcrumbList";
import { getCanList } from "./getCanList";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    useEffect(() => {
        dispatch(getCanList());
    }, [dispatch]);

    return (
        <>
            <Breadcrumb>
                <BreadcrumbItem isCurrent pageName="CANs" />
            </Breadcrumb>

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
                                <Link id="lnkCans" to={"./" + can.id}>
                                    {can.number}
                                </Link>
                            </th>
                            <td>{can.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Outlet />
        </>
    );
};

export default CanList;
