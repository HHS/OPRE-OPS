import styles from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import CANFundingBar from "../CANFundingBar/CANFundingBar";

const CANFundingYTD = (props) => {
    const gridRowText = `grid-row padding-top-1 ${styles.gridRowText}`;

    return (
        <div>
            <div className="grid-row padding-top-1 padding-bottom-1">
                <div className="grid-col-2">
                    <CurrencyWithSmallCents
                        amount="14000000.00"
                        dollarsClasses="font-sans-3xs text-bold"
                        centsStyles={{ fontSize: "8px" }}
                    />
                </div>
                <div className="grid-col-2 grid-offset-8">
                    <div className={styles.right}>
                        <CurrencyWithSmallCents
                            amount="3000000.00"
                            dollarsClasses="font-sans-3xs text-bold"
                            centsStyles={{ fontSize: "8px" }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.barBox}>
                <CANFundingBar />
            </div>
            <div className={gridRowText}>
                <div className="grid-col-2">
                    <span>Received</span>
                </div>
                <div className="grid-col-2 grid-offset-8">
                    <span className={styles.right}>Expected</span>
                </div>
            </div>
        </div>
    );
};

export default CANFundingYTD;
