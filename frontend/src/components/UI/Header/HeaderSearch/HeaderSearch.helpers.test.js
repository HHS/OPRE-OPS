import { describe, expect, it } from "vitest";
import { getMatchedField, splitHighlight } from "./HeaderSearch.helpers";

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
});

describe("splitHighlight", () => {
    it("splits around the first case-insensitive match", () => {
        expect(splitHighlight("Early Head Start Head", "head")).toEqual(["Early ", "Head", " Start Head"]);
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
