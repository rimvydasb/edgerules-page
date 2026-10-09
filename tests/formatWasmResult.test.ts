import { formatWasmResult } from "../src/utils/parseBaseExamples";

describe("formatWasmResult", () => {
    it("produces valid JSON for nested objects and arrays", () => {
        const value = {
            status: "INELIGIBLE",
            failed: ["income"],
            applicant: { age: 30, income: 800, defaults: 0 },
            checks: [
                { name: "age", passed: true },
                { name: "income", passed: false },
            ],
        };
        const output = formatWasmResult(value);
        expect(JSON.parse(output)).toEqual(value);
        expect(output).toContain('"failed": ["income"]');
    });
});
