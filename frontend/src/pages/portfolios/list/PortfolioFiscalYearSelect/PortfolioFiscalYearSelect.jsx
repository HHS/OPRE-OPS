import FiscalYear from "../../../../components/UI/FiscalYear";

/**
 * @description - The Fiscal Year Select component for the Portfolio List.
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear
 * @param { (e: string) => void } props.setSelectedFiscalYear
 * @returns  {JSX.Element} - The component JSX.
 */
const PortfolioFiscalYearSelect = ({ fiscalYear, setSelectedFiscalYear }) => {
    return (
        <FiscalYear
            fiscalYear={fiscalYear}
            handleChangeFiscalYear={setSelectedFiscalYear}
        />
    );
};

export default PortfolioFiscalYearSelect;
