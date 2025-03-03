import { getAuthorizationCode, isValidToken } from "./auth";
import { jwtDecode } from "jwt-decode";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock jwt-decode
vi.mock("jwt-decode", () => ({
    jwtDecode: vi.fn()
}));

// nosemgrep - test tokens only
const expiredToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjEwMDAwMDAwMDEsImlzcyI6Imh0dHBzOi8vb3ByZS1vcHMtYmFja2VuZC1kZXYiLCJhdWQiOiJodHRwczovL29wcmUtb3BzLWZyb250ZW5kLWRldiIsInJvbGVzIjpbImFkbWluIl19.S55CU9Kuhnz-Z5xvaX4fNJYJz0iY1JRJuRZ4LmTAAUCSvepXAIT3B5hAcl97-HH21LN5D1TpOAPE4OP5QADZG7h_8ISX3STRRL_fmmQZcPczvaNsNUW2UNT5RcFUcOprjM683TXIPp66ZLnLk6NA2j_MJMJC0wt-YPF2ZKC57NrxMhoCR-dYBc78KojrqLAQx1bG4KDBTtHq2HJIb1tuYsXbNy2gk3Wghp-8xKJK6-fJS2c4xG7-Dxiyvg7oukzzClBpeA-KYiyUW8zdxeMthekRabvkwdjHMhm1ixs11UOKxv6iV32ueV_kYz3MAIuHEsnR07oVnZ4wQHsOk5lwAw"; // nosemgrep
// nosemgrep - test tokens only
const badIssToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjE5NjUxNTEzOTEsImlzcyI6Imh0dHA6Ly9vcHMtaW52YWxpZC1pc3N1ZXIiLCJhdWQiOiJodHRwczovL29wcmUtb3BzLWZyb250ZW5kIiwicm9sZXMiOlsiYWRtaW4iXX0.MQG1wzAEZV4Aq-KPXeT0E0NFGB-2d1Xm9ZkhUz15BGna-c37VredS-r75zA9OkK5r5pPvjdJU5mNPrr1co4SdEtnZK8PW4Ilvi_XMHwTflBV8cOhoz74jEbf0Hj_CDPX3PCsH4Surxun7CELTR775QYRa5EdEgxUX7LREJXZj1PhHissr8tQpr30LWAKLqNUr0KXJGauXN-YxfbuT_fxlV_P6Q_mY0RqEZAdvgmZs3KB3L_hqb7tj6TCtieXXIEkZICZGIPCq9rd3kYAQoDjGO8Qw5hnePTK_focZ46Rj1gcrLa_Ot-qg0L6GzJdv_Qmby5akIGc8i7kCDzmL_BHZw"; // nosemgrep
// nosemgrep - test tokens only
const validToken =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNjk1MTQ5NTkxLCJqdGkiOiJlOGUwMTY2ZS1lNTYyLTQ3N2UtOWJiMy05MjA1OTFiNmEyMjUiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0xMTExLWExMTEtMDAwMDAwMDAwMDE4IiwibmJmIjoxNjk1MTQ5NTkxLCJleHAiOjE5NjUxNTEzOTEsImlzcyI6Imh0dHBzOi8vb3ByZS1vcHMtYmFja2VuZC1kZXYiLCJhdWQiOiJodHRwczovL29wcmUtb3BzLWZyb250ZW5kLWRldiIsInJvbGVzIjpbImFkbWluIl19.D2hsHXvRIq5ALbkrRP5DKtYqhVcaO0ooTZwF_Y9YXYP1WswZNVI5ZrCD3ez-WHqPbcrOKCzpHhBzo-WFw2zMMq0txybU3AtNvog1n49k3xOT4CMcSS0DwCnv9RJetJsxeBIbR1kGHlsip71aXbsDbxmZ5pRgxPxMtUYRjmqafIMZfmWoLgDA3Mk0EaJBwfJj9Ruy3oyzzNG6Ce7EF5-MunPZzfre6rHTcSWzPzIjo5RNFtm5_y8yOTci0Xzl8iqdFi6Gr30ZZbSoxE6KSwuudC8pWldlsg8zkdcXWLhRmgfMroFqjB0SKp655e1OvohKegm-FMdEQqrY6PBE25hwhg"; // nosemgrep

// Mock ApplicationContext
vi.mock("../../applicationContext/ApplicationContext", () => ({
    __esModule: true,
    default: {
        get: vi.fn().mockReturnValue({
            helpers: vi.fn().mockReturnValue({
                authConfig: {
                    fakeauth: {
                        auth_endpoint: "https://dummy/123",
                        client_id: "blah:blah",
                        response_type: "blah",
                        scope: "blah blah",
                        redirect_uri: "http://uri/login",
                        acr_values: "http://acr/values"
                    }
                }
            })
        })
    }
}));

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("getAuthorizationCode", () => {
    it("constructs the URL to get the authentication code to send to the backend", async () => {
        // the nonce is generated at runtime so do not test here
        const stateToken = "system_owner";

        const actualProviderUrl = getAuthorizationCode("fakeauth", stateToken);
        const base_url = actualProviderUrl.href.split("?")[0];
        expect(base_url).toEqual("https://dummy/123");
        expect(actualProviderUrl.searchParams.get("acr_values")).toEqual("http://acr/values");
        expect(actualProviderUrl.searchParams.get("client_id")).toEqual("blah:blah");
        expect(actualProviderUrl.searchParams.get("response_type")).toEqual("blah");
        expect(actualProviderUrl.searchParams.get("scope")).toEqual("blah blah");
        expect(actualProviderUrl.searchParams.get("redirect_uri")).toEqual("http://uri/login");
        expect(actualProviderUrl.searchParams.get("state")).toEqual(stateToken);
    });
});

describe("isValidToken", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns false if token is not provided", () => {
        expect(isValidToken(null).isValid).toBe(false);
        expect(isValidToken(null).msg).toBe("NOT_FOUND");
    });

    it("returns false if token is expired", () => {
        jwtDecode.mockReturnValueOnce({
            exp: 1000000001, // expired timestamp
            iss: "https://opre-ops-backend-dev"
        });

        expect(isValidToken(expiredToken).isValid).toBe(false);
        expect(isValidToken(expiredToken).msg).toBe("EXPIRED");
    });

    it("returns false if token is not issued by the backend", () => {
        jwtDecode.mockReturnValueOnce({
            exp: 1965151391, // future timestamp
            iss: "http://ops-invalid-issuer"
        });

        expect(isValidToken(badIssToken).isValid).toBe(false);
        expect(isValidToken(badIssToken).msg).toBe("ISSUER");
    });

    it("returns true if token is valid", () => {
        jwtDecode.mockReturnValueOnce({
            exp: 1965151391, // future timestamp
            iss: "https://opre-ops-backend-dev"
        });

        expect(isValidToken(validToken).isValid).toBe(true);
        expect(isValidToken(validToken).msg).toBe("VALID");
    });

    it("handles errors during token validation", () => {
        jwtDecode.mockImplementationOnce(() => {
            throw new Error("Invalid token");
        });

        expect(isValidToken("invalid-token").isValid).toBe(false);
        expect(isValidToken("invalid-token").msg).toBe("INVALID");
    });
});
