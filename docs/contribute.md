# Contribute to the Integration

Contributions are very welcome! Please review
[the contribution guidelines](../CONTRIBUTING.md), as well as the standards used
by this project described below.

## Coding Conventions

### Formatting

[Prettier](https://prettier.io/docs/) is used for enforcing code formatting
standards.

Files must pass the the Prettier formatting check in order to be merged.

#### Check formatting

To check for formatting issues, run the following command:

```sh
npm run format:check
```

#### Fix formatting

To automatically fix formatting issues, run the following command:

```sh
npx prettier --write .
```

**NOTE:** Be careful when using the `--write` flag with `prettier`, especially
when targeting a directory. This command modifies files _in-place_,
automatically overwriting any file within that directory (including
sub-directories) to fix formatting issues.

### Static Analysis

[ESLint](https://eslint.org/docs/latest/use/core-concepts/) is used for static
analysis of TypeScript, JavaScript, and JSON files. ESLint is configured using
the [`eslint.config.mjs`](../eslint.config.mjs) file. Refer to the configuration
for the rules that are applied.

[markdownlint](https://github.com/DavidAnson/markdownlint?tab=readme-ov-file#markdownlint)
is used for static analysis of Markdown files.

Files must pass static analysis in order to be merged.

#### Lint files

To perform static analysis using both ESLint and markdownlint, run the following
command:

```sh
npm run lint
```

### Commit Messages

Commit messages must follow
[the conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/).

The basic commit message structure is as follows.

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

Please use one of the types below.

- `feat` (bumps minor version)
- `fix` (bumps patch version)
- `chore`
- `build`
- `docs`
- `test`

Any type can be followed by the `!` character to indicate a breaking change.
Additionally, any commit that has the text `BREAKING CHANGE:` in the footer will
indicate a breaking change.

## Development

### Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node](https://nodejs.org/en/download)

**NOTE:** This project was developed using Node
[`v20.19.5`](https://nodejs.org/en/download/archive/v20.19.5) and NPM `10.8.2`.

### Setup

1. Clone the repository

   ```sh
   git clone git@github.com:newrelic-experimental/nr-labs-teams-sync-action.git
   cd nr-labs-teams-sync-action
   ```

2. Install dependencies

   ```sh
   npm install
   ```

### Testing

#### Unit tests

To run all unit tests, run the following command:

```sh
npm run test
```

Test suites can also be run individually. For example, to run only the `actions`
test suite, run the following command:

```sh
NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest ./__tests__/action.test.ts
```

To run other test suites, replace `action.test.ts` with the appropriate test
suite file.

#### Coverage

Coverage reports can be found in the `coverage` directory generated after
running any unit tests. Global test coverage must be greater than or equal to
90% in order to be merged.

#### Integration tests

An [integration test suite](../__tests__/integration.test.ts) is provided that
can run tests directly against a live New Relic production
[organization](https://docs.newrelic.com/docs/accounts/accounts-billing/account-structure/new-relic-account-structure/#organization-accounts).

To run the integration tests, first create a `.env` file at the repository root
with the following variables:

<!-- markdownlint-disable -->

| Variable Name                           | Required | Description                                                                                                 | Default |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| INPUT_ORG-ID                            | Yes      | The ID of the New Relic organization where teams will be created                                            | N/a     |
| INPUT_AUTHENTICATION-DOMAIN-ID-1        | Yes      | The ID of an authentication domain within the specified New Relic organization where users 1 and 2 exist    | N/a     |
| INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-1 | Yes      | The email of a New Relic user account that exists within authentication domain 1                            | N/a     |
| INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-2 | Yes      | The email of a different New Relic user account that exists within authentication domain 1                  | N/a     |
| INPUT_AUTHENTICATION-DOMAIN-ID-2        | Yes      | The ID of a different authentication domain within the specified New Relic organization where user 3 exists | N/a     |
| INPUT_AUTHENTICATION-DOMAIN-ID-2-USER-1 | Yes      | The email of a New Relic user account that exists within authentication domain 2                            | N/a     |
| INPUT_API-KEY                           | Yes      | The New Relic User key that will be used for GraphQL calls                                                  | N/a     |
| INPUT_REGION                            | No       | The New Relic datacenter (`US` or `EU`)                                                                     | `US`    |
| INPUT_TEST-TIMEOUT                      | No       | The maximum amount of time tests are allowed to take, in milliseconds                                       | `30000` |

<!-- markdownlint-enable -->

For example:

```env
INPUT_ORG-ID=00000000-1234-0000-5678-123456781234
INPUT_AUTHENTICATION-DOMAIN-ID-1=12345678-0000-abcd-0000-12345678abcd
INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-1=fake-user-1@fake-domain-123.com
INPUT_AUTHENTICATION-DOMAIN-ID-1-USER-2=fake-user-2@fake-domain-123.com
INPUT_AUTHENTICATION-DOMAIN-ID-2=87654321-0000-dcba-0000-87654321cdef
INPUT_AUTHENTICATION-DOMAIN-ID-2-USER-1=fake-user-3@fake-domain-123.com
INPUT_API-KEY=NRAK-000000000XXXXXXYYYYYYZZZZZZ
INPUT_REGION=US
INPUT_TEST-TIMEOUT-MS=30000
```

Then, run the integration tests using the following command:

```sh
npm run integration
```

### Packaging

The [`rollup`](https://rollupjs.org/introduction/) module bundler is used to
transpile the TypeScript code for the action into regular JavaScript and bundle
it together with all it's dependencies into a single JavaScript file located at
[`dist/index.js`](../dist/index.js) along with a sourcemap located at
[`dist/index.js.map`](../dist/index.js.map). To generate the bundled JavaScript
file and the sourcemap, run the following command:

```sh
npm run package
```

## Releases

Releases are created following the
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
guidelines of the [GitHub Actions Toolkit](https://github.com/actions/toolkit).

## GitHub Workflows

### Continuous Integration

The [`ci.yml`](../.github/workflows/ci.yml) workflow is triggered when a push is
made to the `main` branch and when pull requests are opened against the `main`
branch. This workflow performs the following steps:

- Checks [formatting](#check-formatting)
- Runs [static analysis](#static-analysis)
- Runs all [unit tests](#unit-tests)

### Check Transpiled JavaScript

The [`check-dist.yml`](../.github/workflows/check-dist.yml) workflow is
triggered when a push is made to the `main` branch and when pull requests are
opened against the `main` branch. This workflow generates the module bundle and
compares it to the [packaged](#packaging) module bundle at `dist/index.js`. The
workflow will fail if there are differences.
