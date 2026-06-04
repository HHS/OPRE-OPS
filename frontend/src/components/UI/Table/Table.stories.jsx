import { fn } from "storybook/test";
import Table from "./Table";

export default {
    title: "UI/Table",
    component: Table,
    parameters: {
        docs: {
            description: {
                component:
                    "USWDS-styled data table with sortable column headers. " +
                    "Displays sort direction arrows and fires onClickHeader for column sorting."
            }
        }
    },
    argTypes: {
        selectedHeader: { control: "text", description: "Currently sorted column value" },
        sortDescending: { control: "boolean", description: "Sort direction" }
    },
    args: {
        onClickHeader: fn()
    }
};

const sampleHeadings = [
    { heading: "Name", value: "name" },
    { heading: "Status", value: "status" },
    { heading: "Amount", value: "amount" },
    { heading: "Date", value: "date" }
];

/** Basic table with headings and rows. */
export const Default = {
    args: {
        tableHeadings: sampleHeadings
    },
    render: (args) => (
        <Table {...args}>
            <tr>
                <td>Agreement A</td>
                <td>Draft</td>
                <td>$100,000</td>
                <td>01/15/2025</td>
            </tr>
            <tr>
                <td>Agreement B</td>
                <td>Executing</td>
                <td>$250,000</td>
                <td>03/01/2025</td>
            </tr>
            <tr>
                <td>Agreement C</td>
                <td>Planned</td>
                <td>$75,000</td>
                <td>06/20/2025</td>
            </tr>
        </Table>
    )
};

/** Sorted by "Name" ascending — shows up arrow on the sorted column. */
export const Sortable = {
    args: {
        tableHeadings: sampleHeadings,
        selectedHeader: "name",
        sortDescending: false
    },
    render: (args) => (
        <Table {...args}>
            <tr>
                <td>Agreement A</td>
                <td>Draft</td>
                <td>$100,000</td>
                <td>01/15/2025</td>
            </tr>
            <tr>
                <td>Agreement B</td>
                <td>Executing</td>
                <td>$250,000</td>
                <td>03/01/2025</td>
            </tr>
        </Table>
    )
};

/** Empty table with no rows. */
export const Empty = {
    args: {
        tableHeadings: sampleHeadings
    },
    render: (args) => <Table {...args} />
};
