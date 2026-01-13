# Configuration

The `nr-labs-team-sync-action` supports the following input properties.

<!-- markdownlint-disable -->

| Name                     | Type   | Required | Default | Description                                                                                                    |
| ------------------------ | ------ | -------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| org-id                   | string | TRUE     | n/a     | New Relic organization ID                                                                                      |
| authentication-domain-id | string | FALSE    | `''`    | Default New Relic authentication domain ID (see [Team Members](./team-definition-file-format.md#team-members)) |
| api-key                  | string | TRUE     | n/a     | New Relic User API Key                                                                                         |
| region                   | string | FALSE    | `US`    | New Relic Data Center                                                                                          |
| files-added              | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been added                                     |
| files-modified           | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been modified                                  |
| files-deleted            | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been deleted                                   |

<!-- markdownlint-enable -->

**NOTE:** The New Relic user associated with the specified User API key _must_
have access to create, delete, and modify teams. Refer to the documentation on
[teams permissions](https://docs.newrelic.com/docs/service-architecture-intelligence/teams/manage-teams/#teams-permissions)
for more details.
