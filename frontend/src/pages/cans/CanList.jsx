import { useSelector, useDispatch } from "react-redux";
import { getCanList } from "./logic";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);

    // dispatch(getCanList());

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
                        <tr key={can.number}>
                            <td>
                                <a href={can.id}>{can.number}</a>
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
