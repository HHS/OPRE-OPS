/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/");
});

it("Notification Center appears when you click the bell icon and has 1 item in list", () => {
    cy.get("use")
        .should("have.attr", "href")
        .and("match", /notifications_(active|none)/);
    cy.get("#notification-center-bell").click();
    cy.contains("Notifications");
    cy.get("body").then(($body) => {
        const notificationCount = $body.find("[data-cy='notification-center-list']").length;
        if (notificationCount > 0) {
            // notifications not visible after clicking clear button
            cy.get("#clear-all-button").click();
            cy.get("[data-cy='notification-center-list']").its("length").should("eq", 0);
        }
    });
    cy.get("use").should("have.attr", "href").and("contain", "notifications_none");
});
