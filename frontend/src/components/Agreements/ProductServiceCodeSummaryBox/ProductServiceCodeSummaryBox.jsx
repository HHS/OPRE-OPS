import PropTypes from "prop-types";
import React from "react";

const ProductServiceCodeSummaryBox = ({ selectedProductServiceCode }) => {
    const { naics, support_code } = selectedProductServiceCode;

    return (
        <div
            className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
            style={{ width: "19.5625rem", minHeight: "4.375rem" }}
        >
            <dl className="margin-0 padding-y-2 padding-x-105 display-flex flex-justify">
                <div>
                    <dt className="margin-0 text-base-dark">NAICS Code</dt>
                    <dd className="text-semibold margin-0">{naics}</dd>
                </div>
                <div>
                    <dt className="margin-0 text-base-dark">Program Support Code</dt>
                    <dd className="text-semibold margin-0">{support_code}</dd>
                </div>
            </dl>
        </div>
    );
};

export default ProductServiceCodeSummaryBox;

ProductServiceCodeSummaryBox.propTypes = {
    selectedProductServiceCode: PropTypes.shape({
        naics: PropTypes.number.isRequired,
        support_code: PropTypes.string.isRequired,
    }).isRequired,
};
