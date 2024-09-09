# Rott.dev Action

This is a working progress action that will run Rott.dev on your codebase.

## Basic

```yaml
- name: rott-dev
  uses: rott-dev/action@0.5.1
```

## Advanced

```yaml
- name: rott-dev
  uses: rott-dev/action@0.5.1
  with:
    organization: rott-dev
    repository: sample-shared-rules
    rule_path: rott.json
    branch: main
    github_token: ${{ secrets.SHARED_RULES_TOKEN }}
    rott_token: ${{ secrets.ROTT_TOKEN }}
```

## Inputs

| Name         | Description              | Required | Default                        |
| ------------ | ------------------------ | -------- | ------------------------------ |
| organization | GitHub organization name | false    | ${{ github.repository_owner }} |
| repository   | GitHub repository name   | false    | rott-dev                       |
| rule_path    | Path to the Rott file    | false    | rott.json                      |
| branch       | Branch name              | false    | main                           |
| github_token | GitHub token             | false    |                                |
| rott_token   | Rott token               | false    |                                |

### Organization, repository, rule_path, branch

All of these inputs are used to specify the location of the shared Rott file.

### Github token

Is used to get shared rules file from another repository.

### Rott token

Is used to send the result of the action to the Rott Dashboard.

## Outputs

| Name       | Description            |
| ---------- | ---------------------- |
| percentage | the score of all rules |
