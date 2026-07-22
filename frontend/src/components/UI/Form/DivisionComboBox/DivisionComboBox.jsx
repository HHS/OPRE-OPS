import ComboBox from "../ComboBox";

/**
 * @typedef {import("../../../../types/PortfolioTypes").Division} Division
 */

/**
 * A multi-select ComboBox for filtering by division.
 * @component
 * @param {Object} props - The component props.
 * @param {Division[]} props.divisionOptions - All the division options.
 * @param {Division[]} props.division - The currently selected divisions.
 * @param {Function} props.setDivision - A function to call to set the selected divisions.
 * @param {string} [props.legendClassname] - The class name for the label (optional).
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered Division ComboBox component.
 */
const DivisionComboBox = ({
    divisionOptions,
    division,
    setDivision,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="division-combobox-input"
                >
                    Division
                </label>
                <div>
                    <ComboBox
                        namespace="division-combobox"
                        data={divisionOptions}
                        selectedData={division}
                        setSelectedData={setDivision}
                        optionText={(division) => division.name}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default DivisionComboBox;
