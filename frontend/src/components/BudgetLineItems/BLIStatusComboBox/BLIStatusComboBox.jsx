import { convertCodeForDisplay } from "../../../helpers/utils";
import ComboBox from "../../UI/Form/ComboBox";

/**
 *  A comboBox for choosing a BLI status.
 * @param {Object} props - The component props.
 * @param {object[]} props.selectedBLIStatus - The currently selected BLI status.
 * @param {Function} props.setSelectedBLIStatus - A function to call when the selected BLI status changes.
 * @param {string[]} props.statusOptions - An array of budget line status options.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const BLIStatusComboBox = ({
    selectedBLIStatus,
    setSelectedBLIStatus,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
    statusOptions = ["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED"]
}) => {
    const newStatusOption = statusOptions.map((status, index) => {
        const statusOption = {
            id: index + 1,
            title: convertCodeForDisplay("budgetLineStatus", status),
            status: status
        };
        return statusOption;
    });

    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="project-combobox-input"
                >
                    Budget Lines Status
                </label>
                <div>
                    <ComboBox
                        namespace="bli-status-combobox"
                        data={newStatusOption}
                        selectedData={selectedBLIStatus}
                        setSelectedData={setSelectedBLIStatus}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default BLIStatusComboBox;
