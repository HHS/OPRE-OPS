import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import { getCanList } from "./getCanList";
import { useEffect } from "react";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    useEffect(() => {
        dispatch(getCanList());
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
                        <Link to="/cans" className="usa-breadcrumb__link">
                            CANs
                        </Link>
                    </li>
                </ol>
            </nav>

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
