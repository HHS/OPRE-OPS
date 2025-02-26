import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    // Only validate the needbyDate field if it has a value since it is not required
    if (data.needByDate.length === 0) {
        return;
    }
    test("needByDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.needByDate).matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });
    test("needByDate", "Date must be in the future", () => {
        const today = new Date();
        const enteredDate = new Date(data.needByDate);
        enforce(enteredDate.getTime()).greaterThan(today.getTime());
    });
});

export default suite;
