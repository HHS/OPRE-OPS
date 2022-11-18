import styles from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import CANFundingBar from "../CANFundingBar/CANFundingBar";

const CANFundingYTD = (props) => {
    const gridRow = `grid-row`;
    const barBox = `${styles.barBox}`;

    return (
        <div>
            <div className={gridRow}>
                <div className="grid-col-1">
                    <CurrencyWithSmallCents
                        amount="14000000.00"
                        dollarsClasses="font-sans-3xs text-bold"
                        centsStyles={{ fontSize: "8px" }}
                    />
                </div>
                <div className="grid-col-1 grid-offset-10">
                    <CurrencyWithSmallCents
                        amount="3000000.00"
                        dollarsClasses="font-sans-3xs text-bold"
                        centsStyles={{ fontSize: "8px" }}
                    />
                </div>
            </div>
            <div className={barBox}>
                <CANFundingBar />
            </div>
        </div>
    );
};

export default CANFundingYTD;
