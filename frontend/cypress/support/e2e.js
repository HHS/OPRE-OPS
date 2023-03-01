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

Cypress.Commands.add("login", () => {
    window.localStorage.setItem("access_token", "123");
});

Cypress.Commands.add("fakeLogin", async () => {
    Cypress.log({
        name: "fakeLogin",
    });

    const alg = "RS256";
    const keyBase64 = Cypress.env("testkey");
    const key = Buffer.from(keyBase64, "base64");
    const privateKey = await jose.importPKCS8(key.toString(), "RS256");

    const jwt = await new jose.SignJWT({ type: "access" })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setSubject("00000000-0000-1111-a111-000000000004")
        .setExpirationTime("2h")
        .sign(privateKey);


    window.localStorage.setItem("access_token", jwt);
});
