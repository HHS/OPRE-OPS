// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "cypress-localstorage-commands";
import "cypress-axe";
import "./commands";
import * as jose from "jose";
import { login } from "../../src/components/Auth/authSlice";

const users = [
    {
        name: "admin",
        first_name: "Emily",
        last_name: "Ball",
        division: 1,
        email: "emily.ball@example.com",
        role: "Admin",
        oidc_id: "00000000-0000-1111-a111-000000000001",
    },
    {
        name: "director",
        first_name: "Bethanne",
        last_name: "Barnes",
        division: 4,
        email: "Bethanne.Barnes@example.com",
        role: "Division Director",
        oidc_id: "00000000-0000-1111-a111-000000000002",
    },
    {
        name: "cor",
        first_name: "Meryl",
        last_name: "Barofsky",
        division: 1,
        email: "Meryl.Barofsky@example.com",
        role: "COR",
        oidc_id: "00000000-0000-1111-a111-000000000003",
    },
    {
        name: "basic",
        first_name: "Anne",
        last_name: "Bergan",
        division: 3,
        email: "Anne.Bergan@example.com",
        role: "View-Only",
        oidc_id: "00000000-0000-1111-a111-000000000004",
    },
];

const generateJWT = async (name) => {
    const alg = "RS256";
    const keyBase64 = Cypress.env("testkey");
    const key = Buffer.from(keyBase64, "base64");
    const privateKey = await jose.importPKCS8(key.toString(), "RS256");
    let user = users.find((u) => u.name === name);

    const jwt = await new jose.SignJWT({ type: "access" })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setSubject(user.oidc_id)
        .setExpirationTime("2h")
        .sign(privateKey);

    return jwt;
};

Cypress.Commands.add("login", () => {
    window.localStorage.setItem("access_token", "123");
});

Cypress.Commands.add("fakeLogin", (name) => {
    cy.session([name], async () => {
        cy.visit("/");
        const jwt = await generateJWT(name);
        window.localStorage.setItem("access_token", jwt);
        //win.store.dispatch(login());
    });
});

Cypress.Commands.add("setIsLoggedIn", (win) => {
    win.store.dispatch(login());
});
