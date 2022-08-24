import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet } from "react-router-dom";
import { getPortfolioList } from "./getPortfolioList";
import { useEffect } from "react";

const PortfolioList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    useEffect(() => {
        dispatch(getPortfolioList());
    }, [dispatch]);

    return (
        <>
            <main>
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

export default PortfolioList;
