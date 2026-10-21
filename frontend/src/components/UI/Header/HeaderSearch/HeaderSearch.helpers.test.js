import { describe, expect, it } from "vitest";
import { getMatchedField, normalizeSearchResponse, sanitizeSearchQuery, splitHighlight } from "./HeaderSearch.helpers";

describe("getMatchedField", () => {
    const result = {
        id: 1,
        name: "Head Start Services",
        nick_name: "HS-ESS",
        agreement_type: "CONTRACT",
        odn: "PO-2024-0071"
    };

    it("prefers the ODN when it matches", () => {
        expect(getMatchedField(result, "po-2024")).toEqual({ field: "odn", label: "ODN", value: "PO-2024-0071" });
    });

    it("falls back to the title, then the nickname", () => {
        expect(getMatchedField(result, "head start")).toEqual({
            field: "name",
            label: "Title",
            value: "Head Start Services"
        });
        expect(getMatchedField(result, "hs-ess")).toEqual({ field: "nick_name", label: "Nickname", value: "HS-ESS" });
    });

    it("prefers the ODN when both the ODN and the title match", () => {
        const both = { ...result, name: "PO-2024 Services" };
        expect(getMatchedField(both, "PO-2024").field).toBe("odn");
    });

    it("handles a null ODN (IAA / Direct Obligation) and null nickname", () => {
        const direct = { id: 2, name: "Banana", nick_name: null, agreement_type: "DIRECT_OBLIGATION", odn: null };
        expect(getMatchedField(direct, "nan")).toEqual({ field: "name", label: "Title", value: "Banana" });
    });

    it("falls back to the title when nothing matches client-side", () => {
        expect(getMatchedField(result, "zzz")).toEqual({ field: "name", label: "Title", value: "Head Start Services" });
    });

    it("trims the query", () => {
        expect(getMatchedField(result, "  hs-ess  ").field).toBe("nick_name");
    });

    it("prefers the title over the nickname when both match", () => {
        const both = { ...result, odn: null, name: "HS-ESS Services" };
        expect(getMatchedField(both, "hs-ess").field).toBe("name");
    });

    it("falls back to the title for an empty or missing query instead of matching everything", () => {
        expect(getMatchedField(result, "").field).toBe("name");
        expect(getMatchedField(result, "   ").field).toBe("name");
        expect(getMatchedField(result, undefined).field).toBe("name");
    });

    it("returns an empty string value when the fallback title is missing", () => {
        expect(getMatchedField({ id: 3, name: null, nick_name: null, odn: null }, "x")).toEqual({
            field: "name",
            label: "Title",
            value: ""
        });
    });
});

describe("splitHighlight", () => {
    it("splits around the first case-insensitive match", () => {
        expect(splitHighlight("Early Head Start Head", "head")).toEqual(["Early ", "Head", " Start Head"]);
    });

    it("matches an upper-case or padded query case-insensitively", () => {
        expect(splitHighlight("Early Head Start", "HEAD")).toEqual(["Early ", "Head", " Start"]);
        expect(splitHighlight("Early Head Start", "  head ")).toEqual(["Early ", "Head", " Start"]);
    });

    it("returns the whole text when there is no match", () => {
        expect(splitHighlight("Alpha", "zzz")).toEqual(["Alpha", "", ""]);
    });

    it("treats regex-special characters literally", () => {
        expect(splitHighlight("PO.2024 (a+b)", ".2024")).toEqual(["PO", ".2024", " (a+b)"]);
        expect(splitHighlight("a+b", "a+b")).toEqual(["", "a+b", ""]);
        expect(splitHighlight("anything", ".*")).toEqual(["anything", "", ""]);
    });

    it("handles null, empty text and empty query", () => {
        expect(splitHighlight(null, "a")).toEqual(["", "", ""]);
        expect(splitHighlight("abc", "")).toEqual(["abc", "", ""]);
        expect(splitHighlight("abc", "   ")).toEqual(["abc", "", ""]);
    });

    it("skips highlighting when lowercasing changes the string length", () => {
        expect(splitHighlight("İstanbul", "stan")).toEqual(["İstanbul", "", ""]);
    });
});

describe("sanitizeSearchQuery", () => {
    it("removes NUL, caps at 100 characters and trims", () => {
        expect(sanitizeSearchQuery("  po\u0000-1  ")).toBe("po-1");
        expect(sanitizeSearchQuery("a".repeat(150))).toBe("a".repeat(100));
        expect(sanitizeSearchQuery(`${" ".repeat(100)}ab`)).toBe("");
    });

    it("returns an empty string for null and undefined", () => {
        expect(sanitizeSearchQuery(null)).toBe("");
        expect(sanitizeSearchQuery(undefined)).toBe("");
    });
});

describe("normalizeSearchResponse", () => {
    it("returns the rows and total as given", () => {
        expect(normalizeSearchResponse({ data: [{ id: 1 }], count: 7 })).toEqual({ results: [{ id: 1 }], count: 7 });
    });

    it("falls back to an empty list, and to the row count when the total is missing", () => {
        expect(normalizeSearchResponse(undefined)).toEqual({ results: [], count: 0 });
        expect(normalizeSearchResponse({})).toEqual({ results: [], count: 0 });
        expect(normalizeSearchResponse({ data: [{ id: 1 }, { id: 2 }] })).toEqual({
            results: [{ id: 1 }, { id: 2 }],
            count: 2
        });
    });
});

describe("getMatchedField for a contract's other numbers", () => {
    const contract = {
        name: "Alpha",
        nick_name: null,
        odn: "PO-1",
        contract_number: "CN-7788",
        task_order_number: "TO-9911"
    };

    it("reports the contract number and the task order number by their own labels", () => {
        expect(getMatchedField(contract, "cn-77")).toEqual({
            field: "contract_number",
            label: "Contract #",
            value: "CN-7788"
        });
        expect(getMatchedField(contract, "to-99")).toEqual({
            field: "task_order_number",
            label: "Task order #",
            value: "TO-9911"
        });
    });

    it("still prefers the ODN when it matches too", () => {
        expect(getMatchedField({ ...contract, contract_number: "PO-1-X" }, "PO-1").field).toBe("odn");
    });
});
