import FiscalYear from "../../../../components/UI/FiscalYear";

/**
 * @description - The Fiscal Year Select component for the CAN List.
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear
 * @param { (e: string) => void } props.setSelectedFiscalYear
 * @param {boolean} [props.showAllOption=true]
 * @returns  {JSX.Element} - The component JSX.
 */
const CANFiscalYearSelect = ({ fiscalYear, setSelectedFiscalYear, showAllOption = true }) => {
    return (
        <FiscalYear
            fiscalYear={fiscalYear}
            handleChangeFiscalYear={setSelectedFiscalYear}
            showAllOption={showAllOption}
        />
    );
};

export default CANFiscalYearSelect;
