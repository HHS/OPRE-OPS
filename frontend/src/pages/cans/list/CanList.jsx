import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { getCanList } from "./logic";
import { useEffect } from "react";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    useEffect(() => {
        dispatch(getCanList());
    }, []);

    return (
        <main>
            <table>
                <caption>List of all CANs</caption>
                <tbody>
                    <tr>
                        <th>number</th>
                        <th>description</th>
                    </tr>
                    {canList.map((can) => (
                        <tr key={can.id}>
                            <td>
                                <Link to={"./" + can.id}>{can.number}</Link>
                            </td>
                            <td>{can.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
};

export default CanList;
