import constants from "../../../constants";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedFiscalYear } from "../../../store/portfolioSlice";
import styles from "./FiscalYear.module.css";

const FiscalYear = () => {
    const dispatch = useDispatch();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    const onChangeFiscalYear = (event) => {
        dispatch(setSelectedFiscalYear({ value: event.target.value }));
    };

    const fiscalYearClasses = `usa-select ${styles.fiscalYearSelector}`;

    return (
        <select
            aria-label="Selected Fiscal Year"
            className={fiscalYearClasses}
            onChange={onChangeFiscalYear}
            value={fiscalYear.value}
        >
            {constants.fiscalYears.map((year) => {
                return (
                    <option key={year} value={year}>
                        Fiscal Year {year}
                    </option>
                );
            })}
        </select>
    );
};

export default FiscalYear;
