import ComboBox from "../../UI/Form/ComboBox";

/**
 * @typedef {Object} DataProps
 * @property {number} id - The identifier of the data item
 * @property {string} title - The title of the data item
 */

/**
 * @component
 * @param {Object} props - The component props.
 * @param {DataProps[]} props.portfolioOptions - All the portfolio options.
 * @param {DataProps[]} props.portfolio - The current portfolio.
 * @param {Function} props.setPortfolio - A function to call to set the portfolio.
 * @param {string} [props.legendClassname] - The class name for the legend (optional).
 * @param {string} [props.defaultString] - The default string to display (optional).
 * @param {Object} [props.overrideStyles] - The CSS styles to override the default (optional).
 * @returns {JSX.Element} - The rendered CAN transfer combo box.
 */
const CANPortfolioComboBox = ({
    portfolioOptions,
    portfolio,
    setPortfolio,
    legendClassname = "usa-label margin-top-0",
    defaultString = "All Portfolios",
    overrideStyles = {}
}) => {
    return (
        <div className="display-flex flex-justify">
            <div>
                <label
                    className={legendClassname}
                    htmlFor="can-portfolio-combobox-input"
                >
                    Transfer
                </label>
                <div>
                    <ComboBox
                        namespace="can-portfolio-combobox"
                        data={portfolioOptions}
                        selectedData={portfolio}
                        setSelectedData={setPortfolio}
                        defaultString={defaultString}
                        overrideStyles={overrideStyles}
                        isMulti={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CANPortfolioComboBox;
