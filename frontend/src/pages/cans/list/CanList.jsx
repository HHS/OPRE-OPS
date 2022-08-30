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
            <main>
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
                <table id="can-list">
                    <caption>List of all CANs</caption>
                    <tbody>
                        <tr>
                            <th>number</th>
                            <th>description</th>
                        </tr>
                        {canList.map((can) => (
                            <tr key={can.id}>
                                <td>
                                    <Link id="lnkCans" to={"./" + can.id}>
                                        {can.number}
                                    </Link>
                                </td>
                                <td>{can.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <Outlet />
        </>
    );
};

export default CanList;
