/// <reference types="cypress" />

import { testLogin } from "./utils";

// OPS-6513: when the Division Director approves a contract modification, the mod gets its own
// Procurement Tracker, and the Procurement Tracker tab opens on the most recent one. An As-Is mod
// (budget lines moved from Planned to Executing, nothing else) needs only steps 1, 5 and 6, so the
// tab shows just those three; every other mod shows all six.
//
// Uses the seeded Awarded contract 523 (OPS-3072 manual-testing fixture). Each test makes its own
// current-FY Planned budget line to execute, sets up and reviews the mod through the API (as
// startContractModification.cy.js does), and checks the tab in the browser. Approved mods can't be
// undone, so every assertion is about the newest tracker, which keeps the spec rerunnable.
const AGREEMENT_ID = 523;
const SERVICES_COMPONENT_ID = 55;
const CAN_ID = 504;
const API = "http://localhost:8080/api/v1";
// Seeded users to change 523's COR to, for an Admin mod; the test uses one that isn't its COR or Alternate COR.
const CANDIDATE_COR_IDS = [512, 513, 514];

/** Request with the signed-in user's token, read when the command runs (not when it's queued). */
const apiRequest = (options) =>
    cy.window().then((win) =>
        cy.request({
            ...options,
            url: `${API}${options.url}`,
            headers: { Authorization: `Bearer ${win.localStorage.getItem("access_token")}`, Accept: "application/json" }
        })
    );

const reviewOpenContractModifications = (action) => {
    testLogin("division-director");
    apiRequest({ url: `/agreements/${AGREEMENT_ID}/contract-modifications/` }).then((response) => {
        response.body.data
            .filter((request) => request.status === "IN_REVIEW")
            .forEach((request) =>
                apiRequest({
                    method: "PATCH",
                    url: `/contract-modification-requests/${request.id}/`,
                    body: { action, reviewer_notes: `E2E ${action.toLowerCase()}` }
                })
                    .its("status")
                    .should("eq", 200)
            );
    });
};

/** September 30 of the current fiscal year: current FY, and still in the future for Pre-Award validation. */
const lastDayOfCurrentFiscalYear = () => {
    const today = new Date();
    const fiscalYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
    return `${fiscalYear}-09-30`;
};

/** A current-FY Planned budget line on 523, aliased as @budgetLineId. */
const createPlannedBudgetLine = () => {
    testLogin("system-owner");
    apiRequest({
        method: "POST",
        url: "/budget-line-items/",
        body: {
            agreement_id: AGREEMENT_ID,
            services_component_id: SERVICES_COMPONENT_ID,
            can_id: CAN_ID,
            line_description: "E2E mod procurement tracker",
            amount: 1000,
            status: "PLANNED",
            date_needed: lastDayOfCurrentFiscalYear(),
            proc_shop_fee_percentage: 0
        }
    }).then((response) => {
        expect(response.status).to.eq(201);
        cy.wrap(response.body.id).as("budgetLineId");
    });
};

/** Send every pending edit on 523, plus the given budget lines, to the Division Director. */
const submitContractModification = (budgetLineItemIds) => {
    testLogin("system-owner");
    apiRequest({
        method: "POST",
        url: `/agreements/${AGREEMENT_ID}/contract-modifications/`,
        body: { budget_line_item_ids: budgetLineItemIds, requestor_notes: "E2E mod procurement tracker" }
    })
        .its("status")
        .should("eq", 201);
};

/** 523's newest tracker from the API (trackers are listed newest first), aliased as @newestTracker. */
const getNewestTracker = () => {
    testLogin("system-owner");
    apiRequest({ url: `/procurement-trackers/?agreement_id=${AGREEMENT_ID}&limit=50` }).then((response) =>
        cy.wrap(response.body.data[0]).as("newestTracker")
    );
};

/** Change 523's COR, which leaves an Admin Change edit pending for the next contract mod. */
const changeCor = () => {
    testLogin("system-owner");
    apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) => {
        const { project_officer_id: cor, alternate_project_officer_id: alternate } = response.body;
        const newCorId = CANDIDATE_COR_IDS.find((id) => id !== cor && id !== alternate);
        apiRequest({ method: "PATCH", url: `/agreements/${AGREEMENT_ID}`, body: { project_officer_id: newCorId } })
            .its("status")
            .should("eq", 200);
    });
};

const visitTracker = () => {
    testLogin("system-owner");
    cy.visit(`/agreements/${AGREEMENT_ID}/procurement-tracker`);
    cy.contains("h2", "Procurement Tracker").should("be.visible");
};

const expectSteps = (names) => {
    cy.get('[data-cy="step-indicator"] .usa-step-indicator__segment-label').should(($labels) => {
        expect([...$labels].map((label) => label.textContent.trim())).to.deep.eq(names);
    });
    cy.get('[data-cy^="step-builder-accordion-"]').should("have.length", names.length);
    cy.get(".step-builder-accordion__step-total").each(($total) => {
        expect($total.text().trim()).to.eq(`of ${names.length}`);
    });
};

const ALL_STEPS = ["Acquisition Planning", "Pre-Solicitation", "Solicitation", "Evaluation", "Pre-Award", "Award"];
const AS_IS_STEPS = ["Acquisition Planning", "Pre-Award", "Award"];

const STEP_LABELS = {
    ACQUISITION_PLANNING: "Acquisition Planning",
    PRE_SOLICITATION: "Pre-Solicitation",
    SOLICITATION: "Solicitation",
    EVALUATION: "Evaluation",
    PRE_AWARD: "Pre-Award",
    AWARD: "Award"
};

describe("Procurement Tracker tab on an agreement with a contract mod (OPS-6513)", () => {
    // Needs no feature flag. On a fresh seed, 523's newest tracker is its seeded As-Is mod's (steps
    // 2-4 skipped), so this checks the three-step view; after other runs it checks whichever is newest.
    it("opens on the newest tracker and shows only the steps it doesn't skip", () => {
        getNewestTracker();
        cy.get("@newestTracker").then((tracker) => {
            expect(tracker.award_type, "523's newest tracker is a contract mod's").to.eq("MODIFICATION");
            const required = [...tracker.steps]
                .sort((a, b) => a.step_number - b.step_number)
                .filter((step) => step.status !== "SKIPPED")
                .map((step) => STEP_LABELS[step.step_type]);
            visitTracker();
            expectSteps(required);
        });
    });
});

describe("Procurement Tracker for a contract mod (OPS-6513)", () => {
    before(function () {
        // Starting a contract mod is behind ENABLE_MODIFIED_LOE_EDITS, which may be off in the E2E stack.
        testLogin("system-owner");
        apiRequest({ url: "/version/" }).then((response) => {
            if (!response.body.enable_modified_loe_edits) {
                this.skip();
            }
        });
    });

    beforeEach(() => {
        // The one-at-a-time rule would block this test's mod if an earlier run left one in review.
        reviewOpenContractModifications("DECLINE");
    });

    it("an Admin mod gets its own tracker with all six steps once the Division Director approves it", () => {
        changeCor();
        createPlannedBudgetLine();
        cy.get("@budgetLineId").then((budgetLineId) => submitContractModification([budgetLineId]));

        reviewOpenContractModifications("APPROVE");

        getNewestTracker();
        cy.get("@newestTracker").then((tracker) => {
            expect(tracker.award_type).to.eq("MODIFICATION");
            expect(tracker.mod_type).to.not.eq("AS_IS");
        });
        visitTracker();
        expectSteps(ALL_STEPS);
        cy.get('[data-cy="step-indicator"] .usa-step-indicator__segment--current').should(
            "contain",
            "Acquisition Planning"
        );
    });

    it("an As-Is mod's tracker shows only Acquisition Planning, Pre-Award and Award, numbered 1-3 of 3", () => {
        // The previous test's approval attached every pending edit, so this mod only executes a line.
        createPlannedBudgetLine();
        cy.get("@budgetLineId").then((budgetLineId) => submitContractModification([budgetLineId]));

        reviewOpenContractModifications("APPROVE");

        getNewestTracker();
        cy.get("@newestTracker").then((tracker) => {
            expect(tracker.mod_type).to.eq("AS_IS");
            expect(tracker.steps.filter((step) => step.status === "SKIPPED").map((step) => step.step_number)).to.deep.eq(
                [2, 3, 4]
            );
        });
        visitTracker();
        expectSteps(AS_IS_STEPS);
        cy.get(".step-builder-accordion__step-number").then(($numbers) => {
            expect([...$numbers].map((number) => number.textContent.trim())).to.deep.eq(["1", "2", "3"]);
        });
        cy.contains('[data-cy^="step-builder-accordion-"]', "Pre Solicitation").should("not.exist");

        // Completing step 1 moves the tracker straight to Pre-Award, shown as step 2 of 3.
        cy.get("@newestTracker").then((tracker) => {
            const stepOne = tracker.steps.find((step) => step.step_number === 1);
            testLogin("system-owner");
            apiRequest({ url: `/agreements/${AGREEMENT_ID}` }).then((response) =>
                apiRequest({
                    method: "PATCH",
                    url: `/procurement-tracker-steps/${stepOne.id}`,
                    body: {
                        status: "COMPLETED",
                        date_completed: new Date().toISOString().slice(0, 10),
                        task_completed_by: response.body.project_officer_id
                    }
                })
                    .its("status")
                    .should("eq", 200)
            );
        });
        visitTracker();
        cy.get('[data-cy="step-indicator"] .usa-step-indicator__segment--current').should("contain", "Pre-Award");
        cy.get('[data-cy="step-indicator"] .usa-step-indicator__segment--complete').should("have.length", 1);

        // Pre-Award approval can be requested: the skipped Evaluation step doesn't block it.
        cy.visit(`/agreements/${AGREEMENT_ID}/pre-award-approval`);
        cy.contains("Step 4 Not Completed").should("not.exist");
        cy.get('[data-cy="send-to-approval-btn"]').should("be.enabled");
    });

    it("declining a mod leaves the Procurement Tracker tab on the most recent tracker", () => {
        getNewestTracker();
        createPlannedBudgetLine();
        cy.get("@budgetLineId").then((budgetLineId) => submitContractModification([budgetLineId]));

        reviewOpenContractModifications("DECLINE");

        cy.get("@newestTracker").then((before) => {
            testLogin("system-owner");
            apiRequest({ url: `/procurement-trackers/?agreement_id=${AGREEMENT_ID}&limit=50` })
                .its("body.data.0.id")
                .should("eq", before.id);
        });
        visitTracker();
        // The previous test's As-Is tracker is still the one shown.
        expectSteps(AS_IS_STEPS);
    });
});
