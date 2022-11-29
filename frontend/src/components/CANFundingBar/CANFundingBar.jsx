import styles from "./styles.module.css";
import { useEffect } from "react";
import { calculateRatio } from "./util";

// Putting this here for now - the work to populate this from the backend is on another branch
const fakeData = {
    received: 1000000.0,
    expected: 1000000.0,
};

const CANFundingBar = ({ data }) => {
    useEffect(() => {
        const ratio = calculateRatio(fakeData);
        document.documentElement.style.setProperty("--can-funding-bar-ratio", ratio);
    }, []);

    return (
        <div className={styles.barBox}>
            <div className={styles.leftBar}></div>
            <div className={styles.rightBar}></div>
        </div>
    );
};

export default CANFundingBar;
