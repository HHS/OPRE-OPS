import CurrencyFormat from "react-currency-format";
import { getCents } from "./util";

const CurrencyWithSmallCents = ({ amount, dollarsClasses, centsClasses }) => (
    <div>
        <CurrencyFormat
            value={parseInt(amount)}
            displayType={"text"}
            thousandSeparator={true}
            prefix={"$ "}
            renderText={(value) => <span className={`${dollarsClasses} text-bold margin-bottom-0`}>{value}</span>}
        />
        <CurrencyFormat
            value={getCents(amount)}
            displayType={"text"}
            renderText={(value) => <span className={`${centsClasses} text-bold margin-bottom-0`}>.{value}</span>}
        />
    </div>
);

export default CurrencyWithSmallCents;
