import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { AGREEMENT_TYPE_ORDER } from "./AgreementSpendingCards.constants";
import styles from "./AgreementSpendingLegend.module.scss";

const AgreementSpendingLegend = ({ agreementTypes = [] }) => {
    if (!agreementTypes || agreementTypes.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.legendGrid}
            data-testid="agreement-spending-legend"
        >
            {AGREEMENT_TYPE_ORDER.map((config) => {
                const typeData = agreementTypes.find((at) => at.type === config.type);
                const total = typeData?.total || 0;

                return (
                    <div
                        key={config.type}
                        className={styles.legendColumn}
                        data-testid={`agreement-spending-legend-${config.type}`}
                    >
                        <div className={styles.legendHeader}>
                            <span className={styles.typeLabel}>{config.label}</span>
                            <CurrencyFormat
                                value={total}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale
                                renderText={(value) => <span className={styles.totalValue}>{value}</span>}
                            />
                        </div>
                        {/* NOTE: New and Continuing amounts display "TBD" because this data is not yet available in production. */}
                        <div className={styles.subRow}>
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={styles.colorDot}
                                style={{ color: config.color }}
                            />
                            <span className={styles.subValue}>New</span>
                            <span className={styles.subValue}>TBD</span>
                        </div>
                        <div className={styles.subRow}>
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={styles.colorDot}
                                style={{ color: config.continuingColor }}
                            />
                            <span className={styles.subValue}>Cont.</span>
                            <span className={styles.subValue}>TBD</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AgreementSpendingLegend;
