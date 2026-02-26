const TEMPORARY_A11Y_ALLOWLIST = [
    {
        id: "A11Y-ALLOW-0001",
        specPattern: "cypress/e2e/agreementList.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in list actions pending component refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0002",
        specPattern: "cypress/e2e/agreementsPagination.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in list actions pending component refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0003",
        specPattern: "cypress/e2e/agreementDetails.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in details headers pending semantic link updates.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0004",
        specPattern: "cypress/e2e/portfolioList.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in list actions pending component refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0005",
        specPattern: "cypress/e2e/portfolioDetail.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in summary widgets pending semantic link updates.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0006",
        specPattern: "cypress/e2e/budgetLineItemsList.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Legacy icon-only links in table actions pending semantic link updates.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0007",
        specPattern: "cypress/e2e/createAgreement.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Form flow has legacy icon-only links pending component refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0008",
        specPattern: "cypress/e2e/createAgreementWithValidations.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Form flow has legacy icon-only links pending component refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0009",
        specPattern: "cypress/e2e/uploadDocument.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Document flow has icon-only links pending semantic link updates.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0010",
        specPattern: "cypress/e2e/notificationCenter.cy.js",
        ruleId: "link-name",
        owner: "frontend-team",
        rationale: "Notification center actions include icon-only links pending refactor.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0011",
        specPattern: "cypress/e2e/portfolioDetail.cy.js",
        ruleId: "svg-img-alt",
        owner: "frontend-team",
        rationale: "Legacy inline SVG icon lacks accessible text in portfolio detail widgets.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0012",
        specPattern: "cypress/e2e/budgetLineItemsList.cy.js",
        ruleId: "svg-img-alt",
        owner: "frontend-team",
        rationale: "Legacy inline SVG icon lacks accessible text in budget line list controls.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0013",
        specPattern: "cypress/e2e/budgetLineItemsList.cy.js",
        ruleId: "landmark-one-main",
        owner: "frontend-team",
        rationale: "Budget line detail state renders duplicate main landmark in legacy layout.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0014",
        specPattern: "cypress/e2e/budgetLineItemsList.cy.js",
        ruleId: "page-has-heading-one",
        owner: "frontend-team",
        rationale: "Budget line detail state occasionally omits a single h1 during transition render.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    },
    {
        id: "A11Y-ALLOW-0015",
        specPattern: "cypress/e2e/budgetLineItemsList.cy.js",
        ruleId: "region",
        owner: "frontend-team",
        rationale: "Budget line detail state has legacy content outside landmark regions.",
        expiresOn: "2026-06-30",
        targetRemovalIssue: "#5149"
    }
];

const isSpecMatch = (specPattern, currentSpec) => {
    if (!currentSpec || !specPattern) {
        return false;
    }

    return currentSpec.endsWith(specPattern);
};

export const validateA11yAllowlist = () => {
    const now = new Date();

    TEMPORARY_A11Y_ALLOWLIST.forEach((entry) => {
        const missingFields = ["id", "specPattern", "ruleId", "owner", "rationale", "expiresOn"].filter(
            (field) => !entry[field]
        );
        if (missingFields.length > 0) {
            throw new Error(
                `Invalid accessibility allowlist entry ${entry.id || "<unknown>"}; missing ${missingFields.join(", ")}`
            );
        }

        const expiry = new Date(entry.expiresOn);
        if (Number.isNaN(expiry.getTime())) {
            throw new Error(`Invalid expiresOn value for accessibility allowlist entry ${entry.id}: ${entry.expiresOn}`);
        }
        if (expiry < now) {
            throw new Error(
                `Expired accessibility allowlist entry ${entry.id}; remove it or extend with justification.`
            );
        }
    });
};

export const isAllowedViolation = ({ specName, ruleId }) => {
    return TEMPORARY_A11Y_ALLOWLIST.some(
        (entry) => isSpecMatch(entry.specPattern, specName) && entry.ruleId === ruleId
    );
};

export const getAllowlistForSpec = (specName) =>
    TEMPORARY_A11Y_ALLOWLIST.filter((entry) => isSpecMatch(entry.specPattern, specName));
