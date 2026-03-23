const ProcShopFilter = ({ value, onChange, options = [] }) => {
    return (
        <div
            className="display-flex flex-justify flex-align-center"
            style={{ width: "10.625rem" }}
        >
            <label
                className="font-sans-xs text-no-wrap"
                htmlFor="proc-shop-select"
            >
                Proc. Shop
            </label>
            <select
                id="proc-shop-select"
                className="usa-select margin-left-1"
                style={{ width: "5.125rem" }}
                onChange={(e) => onChange(e.target.value)}
                value={value}
            >
                <option value="all">All</option>
                {options.map((abbr) => (
                    <option
                        key={abbr}
                        value={abbr}
                    >
                        {abbr}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProcShopFilter;
