# Configuration

The `nr-labs-team-sync-action` supports the following inputs.

<!-- markdownlint-disable -->

| Name           | Type   | Required | Default | Description                                                                   |
| -------------- | ------ | -------- | ------- | ----------------------------------------------------------------------------- |
| org-id         | string | TRUE     | n/a     | New Relic organization ID                                                     |
| api-key        | string | TRUE     | n/a     | New Relic User API Key                                                        |
| region         | string | FALSE    | `US`    | New Relic Data Center                                                         |
| files-added    | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been added    |
| files-modified | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been modified |
| files-deleted  | string | FALSE    | `''`    | Comma-separated list of repository relative file paths the have been deleted  |

<!-- markdownlint-enable -->
