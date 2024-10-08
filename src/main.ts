/**
 * The entrypoint for the action.
 */
import * as core from '@actions/core'
import { getOctokit, context } from '@actions/github'
import fs from 'fs'
import axios from 'axios'

import { parseRules } from './parser'
import { calculateOverallScore } from './utils'

async function run(): Promise<void> {
  try {
    const rott_token: string =
      core.getInput('rott_token') || process.env.ROTT_TOKEN || ''
    const github_token: string =
      core.getInput('github_token') || process.env.GITHUB_TOKEN || ''

    const organization: string =
      core.getInput('organization') || process.env.ORGANIZATION || ''
    const repository: string =
      core.getInput('repository') || process.env.REPOSITORY || ''
    const rule_path: string =
      core.getInput('rule_path') || process.env.RULE_PATH || ''
    const branch: string =
      core.getInput('branch') || process.env.BRANCH || 'main'

    let output: any = []
    let rules: any = []

    const client = getOctokit(github_token)

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
        .then((response: any) => {
          if (response.status === 200) {
            let sr = null
            try {
              sr = JSON.parse(
                Buffer.from(response.data.content, 'base64').toString('utf-8')
              )
            } catch (e: any) {
              console.log(e.message)
            }

            if (sr) {
              rules = rules.concat(sr)
              console.log(`Loaded ${rules.length} shared rules`)
            }
          }
        })
        .catch((e) => {
          console.log(e.message)
        })
    }

    if (fs.existsSync('./rott.json')) {
      const customRules = JSON.parse(fs.readFileSync('./rott.json', 'utf-8'))
      rules = rules.concat(customRules)
      console.log(`Loaded ${customRules.length} custom rules`)
    } else {
      console.log('No custom rules found')
    }

    if (rules.length > 0) {
      output = parseRules(rules)
    }
    core.debug(JSON.stringify(output, null, 2))

    // Calculate the total score
    let totalPercentage: string = '0'
    if (output.length > 0) {
      const overall = calculateOverallScore(output)
      totalPercentage = overall.totalPercentage

      if (rott_token !== '') {
        const organization = context.repo.owner
        const repository = context.repo.repo
        const commit = context.payload.after
        const branchName = context.ref.split('/').pop() || 'main'

        // Get repo information
        const info = await client.request('GET /repos/{owner}/{repo}', {
          owner: organization,
          repo: repository,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })

        core.debug(organization)
        core.debug(repository)
        core.debug(branchName)
        core.debug(commit)

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
        }

        await axios.post('https://api.rott.dev/api/v1/score', payload, {
          headers: {
            Authorization: `Bearer ${rott_token}`
          }
        })
      }
    }

    core.setOutput('percentage', totalPercentage)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
