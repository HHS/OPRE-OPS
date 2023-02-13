import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import App from "../../../App";
import { getCanList } from "./getCanList";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    const tableClasses = "usa-table usa-table--borderless margin-x-auto";

    useEffect(() => {
        dispatch(getCanList());
    }, [dispatch]);

    return (
        <App>
            <h1 className="text-center">CANs</h1>
            <nav>
                <table className={tableClasses}>
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
        </App>
    );
};

export default CanList;
