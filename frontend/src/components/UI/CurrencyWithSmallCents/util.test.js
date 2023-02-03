import { getCents } from "./util";

test("getCents - integer returns 0 cents", async () => {
    expect(getCents(100)).toEqual("00");
});

test("getCents - happy path", async () => {
    expect(getCents(100.13)).toEqual("13");
});

test("getCents - 1 decimal digit", async () => {
    expect(getCents(100.3)).toEqual("30");
});

test("getCents - no non-decimal", async () => {
    expect(getCents(0.3)).toEqual("30");
});

test("getCents - zero", async () => {
    expect(getCents(0)).toEqual("00");
});

test("getCents - string with cents", async () => {
    expect(getCents("1140000.01")).toEqual("01");
});

test("getCents - string with no cents", async () => {
    expect(getCents("100")).toEqual("00");
});

test("getCents - string with tenths", async () => {
    expect(getCents("100.0")).toEqual("00");
});
