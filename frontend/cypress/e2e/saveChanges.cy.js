/// <reference types="cypress" />

import { terminalLog, testLogin } from "./utils";


beforeEach(() => {
    testLogin("system-owner");
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

// describe("Save Changes/Edits in Agreement BLIs", () => {
//     it("save and exit via modal", () => {
//         //go to agreements/10/budget-lines
//         //create new draft bli
//         //press add bli button
//         //check new alert
//         //check modal renders
//         //press save and exit button
//         //check if user was navigated correctly
//         cy.visit('/agreements/10/budget-lines');

//         //go to agreements/10/budget-lines
//         //edit the draft bli that was just created
//         //press add bli button
//         //check new alert
//         //keep track of the changes on the bli
//         //check modal renders
//         //press continue without saving
//         //check user was navigated correctly
//         //go to agreements/10/budget-lines
//         // check if the changes were NOT saved

//         //go to agreements/10/budget-lines
//         // delete the new bli
//         // press yes on delete bli modal
//         // check new alert
//         // navigate away
//         //check modal renders
//         //press save and exit button
//         //check if user was navigated correctly
//         //go to agreements/10/budget-lines
//         // check if the changes were saved
//     });
// });
