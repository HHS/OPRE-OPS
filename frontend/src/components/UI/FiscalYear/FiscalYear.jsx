import constants from "../../../constants";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedFiscalYear } from "../../../store/portfolioSlice";
import styles from "./styles.module.css";

const FiscalYear = () => {
    const dispatch = useDispatch();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);

    const onChangeFiscalYear = (event) => {
        dispatch(setSelectedFiscalYear({ value: event.target.value }));
    };

    const fiscalYearClasses = `usa-select ${styles.fiscalYearSelector}`;

    return (
        <select className={fiscalYearClasses} onChange={onChangeFiscalYear} value={fiscalYear.value}>
            {constants.fiscalYears.map((year) => {
                if (year.toString() === fiscalYear) {
                    return (
                        <option key={year} value={year} selected>
                            Fiscal Year {year}
                        </option>
                    );
                } else {
                    return (
                        <option key={year} value={year}>
                            Fiscal Year {year}
                        </option>
                    );
                }
            })}
        </select>
    );
};

export default FiscalYear;
