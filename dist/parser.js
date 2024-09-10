"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRules = void 0;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
const parseRules = (rules) => {
    const output = [];
    rules.forEach((rule) => {
        const filePath = rule.location;
        const ignoreNotExists = rule.ignoreNotExists === true;
        // If ignoreNotExists is set to false, then continue to the next rule
        if (!fs_1.default.existsSync(filePath)) {
            if (ignoreNotExists) {
                return;
            }
        }
        let score = 0;
        let maxScore = 0;
        let fileContent = '';
        try {
            fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
        }
        catch { }
        let testOutput = [];
        for (const test of rule.test) {
            const mandatory = test.mandatory === false ? false : true;
            const regex = (0, utils_1.regExpFromString)(test.option);
            if (regex === null) {
                throw new Error('Invalid regex');
            }
            if (mandatory) {
                maxScore += test.score;
            }
            if (regex.test(fileContent)) {
                score += test.score;
                testOutput.push({
                    match: test.match,
                    score: test.score
                });
            }
            else {
                if (mandatory) {
                    testOutput.push({
                        notMatch: test.notMatch,
                        score: 0
                    });
                }
                if (test.continue === false) {
                    break;
                }
            }
        }
        output.push({
            name: rule.name,
            score,
            maxScore,
            severity: rule.severity,
            category: rule.category,
            percentage: (score / maxScore) * 100,
            test: testOutput
        });
    });
    return output;
};
exports.parseRules = parseRules;
