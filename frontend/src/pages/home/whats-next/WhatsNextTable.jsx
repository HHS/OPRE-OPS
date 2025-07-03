import { data } from "./data";
import WhatsNextTableRow from "./WhatsNextTableRow";
import styles from "../../../components/UI/Table/table.module.css";
const WhatsNextTable = () => {
    if (!data || data.length === 0) {
        return <p className="text-center">No upcoming features</p>;
    }

    const sortedData = data.sort((a, b) => a.priority - b.priority);

    return (
        <>
            <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Feature</th>
                        <th>Level of Effort</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item) => (
                        <WhatsNextTableRow
                            key={item.id}
                            item={item}
                        />
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default WhatsNextTable;
