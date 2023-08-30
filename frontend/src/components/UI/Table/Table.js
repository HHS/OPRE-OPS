import PropTypes from "prop-types";

/**
 * The Table component is a layout component that displays a table
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The children to render - optional.
 * @param {string[]} props.tableHeadings - The table headings to display.
 * @returns {React.JSX.Element} - The rendered component.
 * @example
 * <Table tableHeadings={["Heading 1", "Heading 2", "Heading 3"]}>
 **/
const Table = ({ children, tableHeadings }) => {
    /**
     * Adds a width to the Status column
     * @param {string} heading - The heading to check
     * @returns {string | undefined} - The width to add if the heading is Status
     *
     */
    const addWidthIfStatus = (heading) => {
        if (heading === "Status") {
            return "width-10";
        }
        return undefined;
    };
    return (
        <table className="usa-table usa-table--borderless width-full">
            <thead>
                <tr>
                    {tableHeadings.map((heading, index) => (
                        <th key={index} scope="col" className={addWidthIfStatus(heading)}>
                            {heading}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
};

Table.propTypes = {
    children: PropTypes.node.isRequired,
    tableHeadings: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Table;
