import BLIStatusSummaryCard from "../../components/BudgetLineItems/BLIStatusSummaryCard/BLIStatusSummaryCard";
import AgreementSpendingSummaryCard from "../../components/Agreements/AgreementSpendingSummaryCard/AgreementSpendingSummaryCard";
import AgreementSpendingCards from "../../components/Agreements/AgreementSpendingCards/AgreementSpendingCards";
import PortfolioSummaryCards from "../../components/Portfolios/PortfolioSummaryCards/PortfolioSummaryCards";
import LineGraphWithLegendCard from "../../components/UI/Cards/LineGraphWithLegendCard";
import { computeDisplayPercents } from "../../helpers/utils";

// ---------------------------------------------------------------------------
// Stub data — worst-case scenarios designed to surface each bug class.
// Values are chosen so that independent per-item rounding produces contradictory
// or incorrect output in the unfixed components.
// ---------------------------------------------------------------------------

const BLI_DOMINANT = {
    totalAmount: 1000,
    totalDraftAmount: 996,
    totalPlannedAmount: 2,
    totalExecutingAmount: 1,
    totalObligatedAmount: 1,
    titlePrefix: "FY 2024 (dominant: 996 Draft + 2+1+1)"
};

const BLI_EQUAL = {
    totalAmount: 1000,
    totalDraftAmount: 250,
    totalPlannedAmount: 250,
    totalExecutingAmount: 250,
    totalObligatedAmount: 250,
    titlePrefix: "FY 2024 (equal split 250×4)"
};

const BLI_TINY_ARC = {
    totalAmount: 1000,
    totalDraftAmount: 995,
    totalPlannedAmount: 5,
    totalExecutingAmount: 0,
    totalObligatedAmount: 0,
    titlePrefix: "FY 2024 (tiny arc: 995 Draft, 5 Planned)"
};

const AGREEMENT_SUMMARY_3WAY = {
    titlePrefix: "FY 2024 (3-way split: 333+333+334+0)",
    contractTotal: 333,
    partnerTotal: 333,
    grantTotal: 334,
    directObligationTotal: 0
};

const AGREEMENT_SUMMARY_DOMINANT = {
    titlePrefix: "FY 2024 (dominant: 996 Contract + 2+1+1)",
    contractTotal: 996,
    partnerTotal: 2,
    grantTotal: 1,
    directObligationTotal: 1
};

const AGREEMENT_SPENDING_3WAY = {
    fiscalYear: "2024",
    spendingData: {
        total_spending: 999,
        agreement_types: [
            { type: "CONTRACT", new: 333, continuing: 0 },
            { type: "GRANT", new: 333, continuing: 0 },
            { type: "DIRECT_OBLIGATION", new: 333, continuing: 0 }
        ]
    }
};

const AGREEMENT_SPENDING_DOMINANT = {
    fiscalYear: "2024",
    spendingData: {
        total_spending: 1000,
        agreement_types: [
            { type: "CONTRACT", new: 996, continuing: 0 },
            { type: "GRANT", new: 4, continuing: 0 }
        ]
    }
};

const makeFundingSummary = (amount) => ({
    fundingSummary: { total_funding: { amount } }
});

const PORTFOLIO_DOMINANT = [
    { id: 1, name: "Child Care", abbreviation: "CC", ...makeFundingSummary(9960) },
    { id: 2, name: "Child Welfare Research", abbreviation: "CWR", ...makeFundingSummary(20) },
    { id: 3, name: "Healthy Start", abbreviation: "HS", ...makeFundingSummary(20) }
];

const PORTFOLIO_EQUAL = [
    { id: 1, name: "Child Care", abbreviation: "CC", ...makeFundingSummary(3330) },
    { id: 2, name: "Child Welfare Research", abbreviation: "CWR", ...makeFundingSummary(3330) },
    { id: 3, name: "Healthy Start", abbreviation: "HS", ...makeFundingSummary(3340) }
];

// ---------------------------------------------------------------------------
// PortfolioFundingStub — PortfolioFunding reads from useOutletContext() which
// requires a router outlet. We inline the same underlying primitives with the
// fixed computeDisplayPercents so the debug page matches production behaviour.
// ---------------------------------------------------------------------------
const PortfolioFundingStub = ({ label, carryForward, newFunding }) => {
    const totalFunding = carryForward + newFunding;
    const data = computeDisplayPercents([
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carryForward,
            color: "var(--portfolio-carry-forward)",
            tagActiveStyle: "portfolioCarryForward"
        },
        {
            id: 2,
            label: "FY 2024 New Funding",
            value: newFunding,
            color: "var(--portfolio-new-funding)",
            tagActiveStyle: "portfolioNewFunding"
        }
    ]);
    return (
        <LineGraphWithLegendCard
            heading={label}
            data={data}
            bigNumber={totalFunding}
        />
    );
};

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.title
 * @param {string|null} props.bug - Red label shown when the bug is NOT yet fixed
 * @param {string|null} props.fix - Green label shown once the bug IS fixed
 * @param {React.ReactNode} props.children
 */
const Section = ({ id, title, bug, fix, children }) => (
    <section
        data-cy={`data-viz-debug-${id}`}
        style={{ marginBottom: "3rem", borderBottom: "1px solid #e0e0e0", paddingBottom: "2rem" }}
    >
        <h2 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{title}</h2>
        {fix && (
            <p
                style={{
                    fontSize: "0.8rem",
                    color: "#1a7a1a",
                    marginBottom: "1rem",
                    fontFamily: "monospace"
                }}
            >
                ✓ FIXED: {fix}
            </p>
        )}
        {bug && !fix && (
            <p
                style={{
                    fontSize: "0.8rem",
                    color: "#b50909",
                    marginBottom: "1rem",
                    fontFamily: "monospace"
                }}
            >
                ✗ BUG (unfixed): {bug}
            </p>
        )}
        {children}
    </section>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const DataVizDebug = () => (
    <div
        className="padding-4"
        style={{ maxWidth: "1100px" }}
    >
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            /dev/data-viz — Percentage Label Bug Review (issue #5513)
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "2.5rem" }}>
            Each section renders a component with stub data chosen to surface worst-case rounding and display bugs.
            Green labels confirm a fix is applied; red labels flag bugs not yet fixed. This route is only available in
            DEV builds.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* 1. BLIStatusSummaryCard                                          */}
        {/* ---------------------------------------------------------------- */}
        <Section
            id="bli-status-dominant"
            title="1a. BLIStatusSummaryCard — dominant item (996 Draft + 2+1+1 others)"
            fix='Draft shows ">99%" instead of "100%"; peers show "<1%" — no contradiction'
        >
            <BLIStatusSummaryCard {...BLI_DOMINANT} />
        </Section>

        <Section
            id="bli-status-equal"
            title="1b. BLIStatusSummaryCard — equal 4-way split (250 each)"
        >
            <BLIStatusSummaryCard {...BLI_EQUAL} />
        </Section>

        <Section
            id="bli-status-tiny-arc"
            title="1c. BLIStatusSummaryCard — tiny arc (995 Draft, 5 Planned = 0.5% of total)"
            fix="Planned arc floored to 1% minimum so it is visible in the donut chart; legend still shows real $5.00 value"
        >
            <BLIStatusSummaryCard {...BLI_TINY_ARC} />
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* 2. AgreementSpendingSummaryCard                                  */}
        {/* ---------------------------------------------------------------- */}
        <Section
            id="agreement-summary-3way"
            title="2a. AgreementSpendingSummaryCard — 3-way equal split (333+333+334+0)"
            fix="Cross-item normalisation applied — percents computed together, not independently"
        >
            <AgreementSpendingSummaryCard {...AGREEMENT_SUMMARY_3WAY} />
        </Section>

        <Section
            id="agreement-summary-dominant"
            title="2b. AgreementSpendingSummaryCard — dominant item (996 Contract + 2+1+1)"
            fix='Contract shows ">99%" instead of "100%"; peers show "<1%" — no contradiction'
        >
            <AgreementSpendingSummaryCard {...AGREEMENT_SUMMARY_DOMINANT} />
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* 3. AgreementSpendingCards (HorizontalStackedBar)                 */}
        {/* ---------------------------------------------------------------- */}
        <Section
            id="agreement-spending-3way"
            title="3a. AgreementSpendingCards — 3 equal segments (333 each)"
            fix="Segments built first, then computeDisplayPercents applied across the full array — no more independent rounding"
        >
            <AgreementSpendingCards {...AGREEMENT_SPENDING_3WAY} />
        </Section>

        <Section
            id="agreement-spending-dominant"
            title="3b. AgreementSpendingCards — dominant segment (996 Contract, 4 Grant)"
            fix='Contract bar shows ">99%", Grant shows "<1%" — aria-label now speaks the guarded percent'
        >
            <AgreementSpendingCards {...AGREEMENT_SPENDING_DOMINANT} />
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* 4. PortfolioFunding (LineGraphWithLegendCard, 2-item complement) */}
        {/* ---------------------------------------------------------------- */}
        <Section
            id="portfolio-funding-dominant"
            title="4a. PortfolioFunding — dominant carry-forward (996 carry-forward, 4 new)"
            fix='carry-forward shows ">99%", new funding shows "<1%" — computed together via computeDisplayPercents'
        >
            <PortfolioFundingStub
                label="FY 2024 Portfolio Total Budget"
                carryForward={996}
                newFunding={4}
            />
        </Section>

        <Section
            id="portfolio-funding-equal"
            title="4b. PortfolioFunding — balanced split (500 each)"
        >
            <PortfolioFundingStub
                label="FY 2024 Portfolio Total Budget"
                carryForward={500}
                newFunding={500}
            />
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* 5. PortfolioSummaryCards + PortfolioLegend                       */}
        {/* ---------------------------------------------------------------- */}
        <Section
            id="portfolio-summary-dominant"
            title="5a. PortfolioSummaryCards — dominant portfolio (CC=9960, CWR=20, HS=20)"
            fix='CC shows ">99%" in the legend; CWR and HS show "<1%" — computeDisplayPercents applied across all portfolios'
        >
            <PortfolioSummaryCards
                fiscalYear="2024"
                filteredPortfolios={PORTFOLIO_DOMINANT}
            />
        </Section>

        <Section
            id="portfolio-summary-equal"
            title="5b. PortfolioSummaryCards — equal 3-way split (3330+3330+3340)"
        >
            <PortfolioSummaryCards
                fiscalYear="2024"
                filteredPortfolios={PORTFOLIO_EQUAL}
            />
        </Section>
    </div>
);

export default DataVizDebug;
