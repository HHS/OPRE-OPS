import PortfolioFunding from "../PortfolioFunding/PortfolioFunding";

const PortfolioFundingSummary = (props) => {
    return (
        <>
            <h3 className="site-preview-heading">Funding Summary</h3>
            <ul className="usa-card-group">
                <li className="usa-card usa-card--flag desktop:grid-col-6 usa-card--media-right">
                    <PortfolioFunding portfolioId={props.portfolioId} />
                </li>
                <li className="usa-card usa-card--flag desktop:grid-col-6"></li>
            </ul>
        </>
    );
};

export default PortfolioFundingSummary;
