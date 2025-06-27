import { data } from "./data";

const WhatsNextTable = () => {
    if (!data || data.length === 0) {
        return <p className="text-center">No upcoming features</p>;
    }

    const sortedData = data.sort((a, b) => a.priority - b.priority);

    return (
        <table className="usa-table usa-table--borderless width-full">
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
                    <tr key={item.id}>
                        <td>{item.priority}</td>
                        <td>{item.title}</td>
                        <td>{item.levelOfEffort}</td>
                        <td>{item.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default WhatsNextTable;
