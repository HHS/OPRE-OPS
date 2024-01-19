import PropTypes from "prop-types";
import ComboBox from "../ComboBox";

/**
 *  A comboBox for choosing a BLI status.
 * @param {Object} props - The component props.
 * @param {array[object]} props.selectedBLIStatus - The currently selected BLI status.
 * @param {Function} props.setSelectedBLIStatus - A function to call when the selected BLI status changes.
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
    overrideStyles = {}
}) => {
    const data = [
        {
            id: 1,
            title: "Draft",
            status: "DRAFT"
        },
        {
            id: 2,
            title: "Planned",
            status: "PLANNED"
        },
        {
            id: 3,
            title: "Executing",
            status: "IN_EXECUTION"
        },
        {
            id: 4,
            title: "Obligated",
            status: "OBLIGATED"
        }
    ];
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
                        data={data}
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

BLIStatusComboBox.propTypes = {
    selectedBLIStatus: PropTypes.array.isRequired,
    setSelectedBLIStatus: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object
};
