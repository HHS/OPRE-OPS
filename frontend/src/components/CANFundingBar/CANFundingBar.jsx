import styles from "./styles.module.css";
import { useEffect, useState } from "react";
import { calculateRatio } from "./util";

const CANFundingBar = ({ current_funding, expected_funding }) => {
    const [ratio, setRatio] = useState(1);

    useEffect(() => {
        if (current_funding && expected_funding) {
            const calculatedRatio = calculateRatio({ received: current_funding, expected: expected_funding });
            setRatio(calculatedRatio);
        }
    }, [current_funding, expected_funding]);

    return (
        <div className={styles.barBox}>
            <div className={styles.leftBar} style={{ flex: ratio }}></div>
            <div className={styles.rightBar}></div>
        </div>
    );
};

export default CANFundingBar;
