import { create, test, enforce, only } from "vest";

const suite = create((data) => {
    // only(data);
    // console.log(`data: ${JSON.stringify(data, null, 2)}`);
    // test to ensure at least one budget line item exists
    test("entered_description", "This is required information", () => {
        enforce(data.entered_description).longerThan(0);
    });
});

export default suite;
