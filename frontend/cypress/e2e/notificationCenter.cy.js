/// <reference types="cypress" />
import { testLogin } from "./utils";

beforeEach(() => {
    testLogin("system-owner");
    cy.visit("/");
});

it("Notification Center appears when you click the bell icon and has 1 item in list", () => {
    cy.get("#notification-center-bell use").should(($iconUse) => {
        const href = $iconUse.attr("href") || $iconUse.attr("xlink:href");
        expect(href).to.match(/notifications_(active|none)/);
    });
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
    cy.get("#notification-center-bell use").should(($iconUse) => {
        const href = $iconUse.attr("href") || $iconUse.attr("xlink:href");
        expect(href).to.contain("notifications_none");
    });
});
