import styles from "./styles.module.scss";
import { useEffect, useState } from "react";
import { calculateRatio } from "./util";

const CANFundingBar = ({ data = [], setActiveId = () => {} }) => {
    const [ratio, setRatio] = useState(1);
    const current_funding = data[0].value;
    const expected_funding = data[1].value;

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: current_funding, expected: expected_funding });

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [current_funding, expected_funding]);

    return (
        <div className={styles.barBox}>
            <div
                className={styles.leftBar}
                style={{ flex: ratio }}
                onMouseEnter={() => setActiveId(data[0].id)}
                onMouseLeave={() => setActiveId(0)}
            />
            <div
                className={styles.rightBar}
                onMouseEnter={() => setActiveId(data[1].id)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

export default CANFundingBar;
