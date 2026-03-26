import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TableRowExpandable from "./TableRowExpandable";

describe("TableRowExpandable", () => {
    it("applies expanded styling to every main row cell", async () => {
        const user = userEvent.setup();

        const TestComponent = () => {
            const [isExpanded, setIsExpanded] = React.useState(false);

            return (
                <table>
                    <tbody>
                        <TableRowExpandable
                            tableRowData={
                                <>
                                    <td data-testid="first-cell">First</td>
                                    <td
                                        data-testid="fy-cell"
                                        className="table-item-error"
                                    >
                                        2043
                                    </td>
                                </>
                            }
                            expandedData={<td colSpan={3}>Expanded</td>}
                            isExpanded={isExpanded}
                            setIsExpanded={setIsExpanded}
                            setIsRowActive={() => {}}
                        />
                    </tbody>
                </table>
            );
        };

        render(<TestComponent />);

        await user.click(screen.getByTestId("expand-row"));

        expect(screen.getByTestId("first-cell")).toHaveClass("border-bottom-none");
        expect(screen.getByTestId("fy-cell")).toHaveClass("table-item-error", "border-bottom-none");
        expect(screen.getByTestId("fy-cell")).toHaveStyle({ backgroundColor: "var(--base-light-variant)" });
    });
});
