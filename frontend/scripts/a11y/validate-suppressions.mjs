import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const targets = ["cypress/e2e", "cypress/support"];
const suppressionRegex =
    /A11Y-SUPPRESSION:\s*owner=([^\s]+)\s+expires=(\d{4}-\d{2}-\d{2})\s+rationale=(.+)$/;
const disabledRuleRegex = /\benabled\s*:\s*false\b/;
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(fullPath);
        }
        if (entry.isFile() && fullPath.endsWith(".js")) {
            return [fullPath];
        }
        return [];
    });
};

const errors = [];
const today = new Date().toISOString().slice(0, 10);

const isExpiredDate = (dateString, todayString) => dateString < todayString;

targets.forEach((target) => {
    const dir = path.join(rootDir, target);
    if (!fs.existsSync(dir)) {
        return;
    }

    walk(dir).forEach((filePath) => {
        const lines = fs.readFileSync(filePath, "utf8").split("\n");
        lines.forEach((line, index) => {
            if (!disabledRuleRegex.test(line)) {
                return;
            }

            const windowStart = Math.max(0, index - 8);
            const contextLines = lines.slice(windowStart, index + 1);
            const suppressionLine = contextLines.find((contextLine) => contextLine.includes("A11Y-SUPPRESSION:"));
            if (!suppressionLine) {
                errors.push(
                    `${path.relative(rootDir, filePath)}:${index + 1} has enabled:false without A11Y-SUPPRESSION metadata`
                );
                return;
            }

            const match = suppressionLine.match(suppressionRegex);
            if (!match) {
                errors.push(
                    `${path.relative(rootDir, filePath)}:${index + 1} has invalid A11Y-SUPPRESSION format (owner/expires/rationale required)`
                );
                return;
            }

            const expiresOn = match[2];
            if (!dateOnlyRegex.test(expiresOn)) {
                errors.push(`${path.relative(rootDir, filePath)}:${index + 1} has invalid suppression expiry date`);
                return;
            }
            if (isExpiredDate(expiresOn, today)) {
                errors.push(
                    `${path.relative(rootDir, filePath)}:${index + 1} suppression is expired (${expiresOn}), remove or renew with rationale`
                );
            }
        });
    });
});

if (errors.length > 0) {
    console.error("Accessibility suppression validation failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log("Accessibility suppression metadata validation passed.");
