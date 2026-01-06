<!-- markdownlint-disable MD041 -->
[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

![GitHub forks](https://img.shields.io/github/forks/newrelic-experimental/nr-labs-teams-sync-action?style=social)
![GitHub stars](https://img.shields.io/github/stars/newrelic-experimental/nr-labs-teams-sync-action?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/newrelic-experimental/nr-labs-teams-sync-action?style=social)

![GitHub all releases](https://img.shields.io/github/downloads/newrelic-experimental/nr-labs-teams-sync-action/total)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/newrelic-experimental/nr-labs-teams-sync-action)
![GitHub last commit](https://img.shields.io/github/last-commit/newrelic-experimental/nr-labs-teams-sync-action)
![GitHub Release Date](https://img.shields.io/github/release-date/newrelic-experimental/nr-labs-teams-sync-action)

![GitHub issues](https://img.shields.io/github/issues/newrelic-experimental/nr-labs-teams-sync-action)
![GitHub issues closed](https://img.shields.io/github/issues-closed/newrelic-experimental/nr-labs-teams-sync-action)
![GitHub pull requests](https://img.shields.io/github/issues-pr/newrelic-experimental/nr-labs-teams-sync-action)
![GitHub pull requests closed](https://img.shields.io/github/issues-pr-closed/newrelic-experimental/nr-labs-teams-sync-action)
![Code coverage](./badges/coverage.svg)

# nr-labs-teams-sync-action

The `nr-labs-teams-sync-action` is a GitHub action that provides a
configuration-as-code solution for managing [New Relic Teams](https://docs.newrelic.com/docs/service-architecture-intelligence/teams/teams/)

## Usage Guide

- [Getting Started](#getting-started)
- [Configuration](./docs/configuration.md)
- [Team Definition File Format](./docs/team-definition-file-format.md)
- [Additional Information](./docs/additional-information.md)
- [Contribute to the Integration](./docs/contribute.md)

## Getting Started

Follow the steps below to quickly create a new GitHub workflow that synchronizes
New Relic Teams with JSON files stored in the `teams` folder of your repository
on a push to the `main` branch.

1. Create a new workflow file called `sync-teams.yml` in your GitHub repository
   with the following contents:

   ```yaml
   name: Synchronize New Relic Teams

   on:
     push:
       branches: [ "main" ]

   jobs:
     sync:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout
           uses: actions/checkout@v6.0.1

         - name: Get Changed Files
           id: changed-files
           uses: tj-actions/changed-files@24d32ffd492484c1d75e0c0b894501ddb9d30d62
           with:
             separator: ","
             files: "teams/**/*.json"

         - name: Sync Teams
           id: sync-teams
           uses: newrelic-experimental/nr-labs-teams-sync-action@v1
           with:
             org-id: ${{ secrets.NEW_RELIC_ORG_ID }}
             api-key: ${{ secrets.NEW_RELIC_API_KEY }}
             region: US
             files-added: ${{ steps.changed-files.outputs.added_files }}
             files-modified: ${{ steps.changed-files.outputs.modified_files }}
             files-deleted: ${{ steps.changed-files.outputs.deleted_files }}
   ```

   **NOTE:** This action depends on the use of [tj-actions/changed-files](https://github.com/tj-actions/changed-files)
   to detect changes to any JSON files in the most recent commit.

2. Commit the new workflow file to you repository and push your changes to
   GitHub.

3. Define a new repository secret named `NEW_RELIC_ORG_ID` with your
   New Relic organization ID as the value.

4. Define a new repository secret named `NEW_RELIC_API_KEY` with your New Relic
   User key as the value.

5. Create a `teams` folder in your repository

6. Copy the file [`team-definition.json`](./examples/team-definition.json) to
   your `teams` folder.

7. Rename the file to the name for your new team. For example, naming the file
   `Engineering.json` will result in a new New Relic Team named `Engineering`.

8. Edit the contents of the file with the details of your new team.

9. Commit the new team file to you repository and push your changes to GitHub.

That's it! When the new team file is pushed to the `main` branch, the new
workflow will automatically create the team in New Relic teams using the name of
the file as the team name and using the contents of the file to define the
members of the team and the other team details.

From now on, any changes (additions, modifications, deletions) to
JSON files in the `teams` directory of your repository will be synchronized with
New Relic Teams in the target organization when changes are pushed to the `main`
branch.

## Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT
WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to
the project here on GitHub.

We encourage you to bring your experiences and questions to the
[Explorers Hub](https://discuss.newrelic.com/) where our community members
collaborate on solutions and new ideas.

### Privacy

At New Relic we take your privacy and the security of your information
seriously, and are committed to protecting your information. We must emphasize
the importance of not sharing personal data in public forums, and ask all users
to scrub logs and diagnostic information for sensitive information, whether
personal, proprietary, or otherwise.

We define “Personal Data” as any information relating to an identified or
identifiable individual, including, for example, your name, phone number, post
code or zip code, Device ID, IP address, and email address.

For more information, review [New Relic’s General Data Privacy Notice](https://newrelic.com/termsandconditions/privacy).

### Contribute

We encourage your contributions to improve this project! Keep in mind that
when you submit your pull request, you'll need to sign the CLA via the
click-through using CLA-Assistant. You only have to sign the CLA one time per
project.

If you have any questions, or to execute our corporate CLA (which is required
if your contribution is on behalf of a company), drop us an email at
[opensource@newrelic.com](mailto:opensource@newrelic.com).

If you would like to contribute to this project, please review the standards
outlined in [Contribute to the Integration](./docs/contribute.md), as well as
[these guidelines](./CONTRIBUTING.md).

<!-- markdownlint-disable-next-line -->
**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed
to the privacy and security of our customers and their data. We believe that
providing coordinated disclosure by security researchers and engaging with the
security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of
New Relic's products or websites, we welcome and greatly appreciate you reporting
it to New Relic through [our bug bounty program](https://docs.newrelic.com/docs/security/security-privacy/information-security/report-security-vulnerabilities/).

### License

The nr-labs-teams-sync-action project is licensed under the
[Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
