"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The entrypoint for the action.
 */
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const parser_1 = require("./parser");
const utils_1 = require("./utils");
async function run() {
    try {
        const rott_token = core.getInput('rott_token') || process.env.ROTT_TOKEN || '';
        const github_token = core.getInput('github_token') || process.env.GITHUB_TOKEN || '';
        const organization = core.getInput('organization') || process.env.ORGANIZATION || '';
        const repository = core.getInput('repository') || process.env.REPOSITORY || '';
        const rule_path = core.getInput('rule_path') || process.env.RULE_PATH || '';
        const branch = core.getInput('branch') || process.env.BRANCH || 'main';
        let output = [];
        let rules = [];
        const client = (0, github_1.getOctokit)(github_token);
        if (github_token !== '') {
            await client
                .request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: organization,
                repo: repository,
                path: rule_path,
                branch,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
                .then((response) => {
                if (response.status === 200) {
                    let sr = null;
                    try {
                        sr = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf-8'));
                    }
                    catch (e) {
                        console.log(e.message);
                    }
                    if (sr) {
                        rules = rules.concat(sr);
                        console.log(`Loaded ${rules.length} shared rules`);
                    }
                }
            })
                .catch((e) => {
                console.log(e.message);
            });
        }
        if (fs_1.default.existsSync('./rott.json')) {
            const customRules = JSON.parse(fs_1.default.readFileSync('./rott.json', 'utf-8'));
            rules = rules.concat(customRules);
            console.log(`Loaded ${customRules.length} custom rules`);
        }
        else {
            console.log('No custom rules found');
        }
        if (rules.length > 0) {
            output = (0, parser_1.parseRules)(rules);
        }
        core.debug(JSON.stringify(output, null, 2));
        // Calculate the total score
        let totalPercentage = '0';
        if (output.length > 0) {
            const overall = (0, utils_1.calculateOverallScore)(output);
            totalPercentage = overall.totalPercentage;
            if (rott_token !== '') {
                const organization = github_1.context.repo.owner;
                const repository = github_1.context.repo.repo;
                const commit = github_1.context.payload.after;
                const branchName = github_1.context.ref.split('/').pop() || 'main';
                // Get repo information
                const info = await client.request('GET /repos/{owner}/{repo}', {
                    owner: organization,
                    repo: repository,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                });
                core.debug(organization);
                core.debug(repository);
                core.debug(branchName);
                core.debug(commit);
                const payload = {
                    organization,
                    repository,
                    branch: branchName,
                    maxScore: overall.totalMaxScore,
                    score: overall.totalScore,
                    percentage: totalPercentage,
                    private: info.data.private,
                    commit,
                    avatar: info.data.owner.avatar_url,
                    summary: output
                };
                await axios_1.default.post('https://api.rott.dev/api/v1/score', payload, {
                    headers: {
                        Authorization: `Bearer ${rott_token}`
                    }
                });
            }
        }
        core.setOutput('percentage', totalPercentage);
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
