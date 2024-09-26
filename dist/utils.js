"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOverallScore = exports.regExpFromString = void 0;
const regExpFromString = (q) => {
    if (q.startsWith('/') && q.endsWith('/')) {
        q = q.slice(1, -1);
    }
    let flags = q.replace(/.*\/([mgiysdvu]*)$/, '$1');
    if (flags === q)
        flags = '';
    let pattern = flags
        ? q.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1')
        : q;
    try {
        return new RegExp(pattern, flags);
    }
    catch (e) {
        return null;
    }
};
exports.regExpFromString = regExpFromString;
const calculateOverallScore = (output) => {
    let totalScore = 0;
    let totalMaxScore = 0;
    output.forEach((rule) => {
        totalScore += rule.score;
        totalMaxScore += rule.maxScore;
    });
    const totalPercentage = ((totalScore / totalMaxScore) * 100).toFixed(1);
    console.log(`Total score: ${totalScore}/${totalMaxScore} (${totalPercentage}%)`);
    return { totalPercentage, totalScore, totalMaxScore };
};
exports.calculateOverallScore = calculateOverallScore;
