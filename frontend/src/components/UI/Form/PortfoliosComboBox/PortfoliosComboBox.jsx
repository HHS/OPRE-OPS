import PropTypes from "prop-types";
import ComboBox from "../ComboBox";
import { useGetPortfoliosQuery } from "../../../../api/opsAPI";

/**
 *  A comboBox for choosing a Portfolio.
 * @param {Object} props - The component props.
 * @param {array[object]} props.selectedPortfolios - The currently selected Portfolios.
 * @param {Function} props.setSelectedPortfolios - A function to call when the selected Portfolios change.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const PortfoliosComboBox = ({
    selectedPortfolios,
    setSelectedPortfolios,
    legendClassname = "usa-label margin-top-0",
    defaultString = "",
    overrideStyles = {},
}) => {
    const { data, error, isLoading } = useGetPortfoliosQuery();

    if (isLoading) {
        return <h1>Loading...</h1>;
    }
    if (error) {
        return <h1>Oops, an error occurred</h1>;
    }

    return (
        <div className="display-flex flex-justify">
            <div>
                <label className={legendClassname} htmlFor="project-combobox-input">
                    Portfolio
                </label>
                <div>
                    <ComboBox
                        namespace="portfolios-combobox"
                        data={data}
                        selectedData={selectedPortfolios}
                        setSelectedData={setSelectedPortfolios}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                        optionText={(data) => data.name}
                    />
                </div>
            </div>
        </div>
    );
};

export default PortfoliosComboBox;

PortfoliosComboBox.propTypes = {
    selectedPortfolios: PropTypes.array.isRequired,
    setSelectedPortfolios: PropTypes.func.isRequired,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    overrideStyles: PropTypes.object,
};
