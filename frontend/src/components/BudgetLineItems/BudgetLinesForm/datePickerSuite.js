import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("needByDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.needByDate).matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });
});

export default suite;
