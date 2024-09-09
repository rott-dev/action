import path from 'path'
import fs from 'fs'

import { regExpFromString } from './utils'

const parseRules = (rules: []) => {
  const output: any = []

  rules.forEach((rule: any) => {
    const filePath = rule.location
    const ignoreNotExists = rule.ignoreNotExists === true

    // If ignoreNotExists is set to false, then continue to the next rule
    if (!fs.existsSync(filePath)) {
      if (ignoreNotExists) {
        return
      }
    }

    let score: number = 0
    let maxScore: number = 0
    let fileContent = ''
    try {
      fileContent = fs.readFileSync(filePath, 'utf-8')
    } catch {}

    let testOutput: any = []
    for (const test of rule.test) {
      const mandatory = test.mandatory === false ? false : true
      const regex = regExpFromString(test.option)
      if (regex === null) {
        throw new Error('Invalid regex')
      }
      if (mandatory) {
        maxScore += test.score
      }
      if (regex.test(fileContent)) {
        score += test.score
        testOutput.push({
          match: test.match,
          score: test.score
        })
      } else {
        if (mandatory) {
          testOutput.push({
            notMatch: test.notMatch,
            score: 0
          })
        }
        if (test.continue === false) {
          break
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
    })
  })
  return output
}

export { parseRules }
