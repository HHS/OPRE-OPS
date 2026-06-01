import { fn } from "storybook/test";
import TableRowExpandable from "./TableRowExpandable";

export default {
    title: "UI/TableRowExpandable",
    component: TableRowExpandable,
    parameters: {
        docs: {
            description: {
                component:
                    "Expandable table row with a chevron toggle. Shows additional detail content " +
                    "in a second row when expanded. Applies background color changes to cells when open."
            }
        }
    },
    decorators: [
        (Story) => (
            <table className="usa-table width-full usa-table--borderless">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <Story />
                </tbody>
            </table>
        )
    ],
    args: {
        setIsExpanded: fn(),
        setIsRowActive: fn()
    }
};

/** Collapsed row — chevron points down. */
export const Collapsed = {
    args: {
        isExpanded: false,
        tableRowData: (
            <>
                <td>Agreement A</td>
                <td>Draft</td>
                <td>$100,000</td>
            </>
        ),
        expandedData: (
            <td colSpan={4}>
                <p>Additional details about Agreement A including budget line items and notes.</p>
            </td>
        )
    }
};

/** Expanded row — chevron points up, detail row is visible. */
export const Expanded = {
    args: {
        isExpanded: true,
        tableRowData: (
            <>
                <td>Agreement A</td>
                <td>Draft</td>
                <td>$100,000</td>
            </>
        ),
        expandedData: (
            <td colSpan={4}>
                <p>Additional details about Agreement A including budget line items and notes.</p>
            </td>
        )
    }
};
