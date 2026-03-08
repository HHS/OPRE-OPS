import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag/Tag";
import styles from "./ReportingCountCard.module.scss";

const STATUS_LABELS = {
    DRAFT: "Draft",
    PLANNED: "Planned",
    IN_EXECUTION: "Executing",
    OBLIGATED: "Obligated"
};

const AGREEMENT_TYPE_LABELS = {
    CONTRACT: "Contracts",
    PARTNER: "Partner",
    GRANT: "Grants",
    DIRECT_OBLIGATION: "Direct Obligations"
};

const PROJECT_TYPE_LABELS = {
    RESEARCH: "Research",
    ADMINISTRATIVE_AND_SUPPORT: "Admin & Support"
};

const AGREEMENT_TYPE_COLORS = {
    CONTRACT: "#11305C",
    PARTNER: "#4AA487",
    GRANT: "#E38356",
    DIRECT_OBLIGATION: "#C54878"
};

const CountColumn = ({ title, total, types, labelMap, getTagProps }) => (
    <div className={styles.column}>
        <h3 className={styles.columnHeader}>{title}</h3>
        <p className={styles.total}>{total}</p>
        <div className={styles.tagList}>
            {types.map(({ type, count }) => (
                <div
                    key={type}
                    className={styles.tagRow}
                >
                    <Tag
                        text={`${count} ${labelMap[type] || type}`}
                        {...getTagProps(type)}
                    />
                </div>
            ))}
        </div>
    </div>
);

const projectTagProps = () => ({ style: { backgroundColor: "#BCD9ED" } });

const agreementTagProps = (type) => ({
    style: { backgroundColor: AGREEMENT_TYPE_COLORS[type], color: "#fff" }
});

const newContinuingTagProps = () => ({ tagStyle: "primaryDarkTextLightBackground" });

const budgetLineTagProps = (type) => ({
    active: true,
    label: STATUS_LABELS[type]
});

const ReportingCountCard = ({ fiscalYear, counts }) => {
    if (!counts) return null;

    return (
        <RoundedBox
            dataCy="reporting-summary-card"
            style={{ width: "100%", maxWidth: "100%" }}
        >
            <div className={styles.grid}>
                <CountColumn
                    title={`FY ${fiscalYear} Projects`}
                    total={counts.projects?.total ?? 0}
                    types={counts.projects?.types ?? []}
                    labelMap={PROJECT_TYPE_LABELS}
                    getTagProps={projectTagProps}
                />
                <CountColumn
                    title={`FY ${fiscalYear} Agreements`}
                    total={counts.agreements?.total ?? 0}
                    types={counts.agreements?.types ?? []}
                    labelMap={AGREEMENT_TYPE_LABELS}
                    getTagProps={agreementTagProps}
                />
                <CountColumn
                    title={`FY ${fiscalYear} New`}
                    total={counts.new_agreements?.total ?? 0}
                    types={counts.new_agreements?.types ?? []}
                    labelMap={AGREEMENT_TYPE_LABELS}
                    getTagProps={newContinuingTagProps}
                />
                <CountColumn
                    title={`FY ${fiscalYear} Continuing`}
                    total={counts.continuing_agreements?.total ?? 0}
                    types={counts.continuing_agreements?.types ?? []}
                    labelMap={AGREEMENT_TYPE_LABELS}
                    getTagProps={newContinuingTagProps}
                />
                <CountColumn
                    title={`FY ${fiscalYear} Budget Lines`}
                    total={counts.budget_lines?.total ?? 0}
                    types={counts.budget_lines?.types ?? []}
                    labelMap={STATUS_LABELS}
                    getTagProps={budgetLineTagProps}
                />
            </div>
        </RoundedBox>
    );
};

export default ReportingCountCard;
