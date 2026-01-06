# Team Definition File Format

The Teams Sync Action creates, updates, and deletes
[New Relic Teams](https://docs.newrelic.com/docs/service-architecture-intelligence/teams/teams/)
based on team definition files stored in the GitHub repository against which the
action is run. A team definition file is a JSON file that contains the team
settings. All settings that can be defined for a team via the team related
mutations in the
[Nerdgraph API](https://docs.newrelic.com/docs/apis/nerdgraph/examples/nerdgraph-teams-tutorial/)
can be managed using the team definition file _except_ entities. This includes
the following settings.

- [Team name](#team-name)
- [Team description](#team-description)
- [Team aliases](#team-aliases)
- [Team members](#team-members)
- [Team contacts](#team-contacts)
- [Team links](#team-links)
- [Team tags](#team-tags)

Refer to the [team definition example](#team-definition-example) for example
usage.

**NOTE:**

- The Team Sync Action performs one-way updates. Changes to team settings made
  separately from the Teams Sync Action (for example, via the New Relic UI) are
  not written back to the team definition files in the GitHub repository and
  will be overwritten in New Relic the next time the team definition file is
  updated.
- Due to the nature of the `entityManagementUpdateTeam` mutation, all team
  settings are updated every time a team definition file is updated, even if
  only one property is updated in the team definition file.

## Team Name

The team name is derived from the name of the team definition file. For example,
to define a team named "Engineering", create a team definition file named
"Engineering.json".

**NOTE:**

- Currently, once a team is created from a team definition file, the team name
  can not be changed via the Teams Sync Action. This only applies to the team
  name. All other team settings can be changed after the team is created. To
  change the name of a team using the Teams Sync Action, first remove the team
  by removing the team definition file with the old name and then create the
  team by creating a team definition file with the new name.
- If the team name includes spaces or other special characters, the name of the
  team definition file must also include the spaces or special characters. For
  example, to create a team named "Product Development" using a team definition
  file, the name of the team definition file must be `Product Development.json`.

## Team Description

The team description is managed using the `description` property of the team
definition . The `description` property is optional. When specified, the value
must be a string.

## Team Aliases

Team aliases are managed using the `aliases` property of the team definition.
The `aliases` property is optional. When specified, the value must be an array
of strings.

## Team Members

Team members are managed using the `members` property of the team definition.
The `members` property is optional. When specified, the value must be an array
of email addresses corresponding to valid New Relic user accounts.

**NOTE:** Currently, there is no way to specify the
[authentication domain](https://docs.newrelic.com/docs/accounts/accounts-billing/new-relic-one-user-management/authentication-domains-saml-sso-scim-more/)
for a given email address. If a given email address exists in more than one
authentication domain within an
[organization](https://docs.newrelic.com/docs/accounts/accounts-billing/account-structure/new-relic-account-structure/),
the Teams Sync Action will fail when creating or updating the membership of the
team referencing the given email address.

## Team Contacts

Team contacts are managed using the `contacts` property of the team definition.
The `contacts` property is optional. When specified the value must be an array
of resource objects, each with the following format:

```json
{
  "type": "[CONTACT_TYPE]",
  "title": "[CONTACT_TITLE]",
  "content": "[CONTACT_CONTENT]"
}
```

All properties of the resource object are required. The value of the `title`
property must be a string and serves as the name of the contact displayed in the
New Relic UI. The value of the `content` property must be a valid email address
or link. The allowed value depends on the value of the `type` property. The
value is used as the target of the link for the name displayed in the New Relic
UI. The `type` property should be one of the following values:

- `EMAIL`
- `FACEBOOK_WORKPLACE`
- `GOOGLE_CHAT`
- `MICROSOFT_TEAMS`
- `PAGERDUTY`
- `ROCKET_CHAT`
- `SKYPE`
- `SLACK`
- `ZENDESK`
- `OTHER_CONTACT`

## Team Links

Team links are managed using the `links` property of the team definition. The
`links` property is optional. When specified the value must be an array of
resource objects, each with the following format:

```json
{
  "type": "[LINK_TYPE]",
  "title": "[LINK_TITLE]",
  "content": "[LINK_CONTENT]"
}
```

All properties of the resource object are required. The value of the `title`
property must be a string and serves as the name of the link displayed in the
New Relic UI. The value of the `content` property must be a valid link. The
value is used as the target of the link for the name displayed in the New Relic
UI. The `type` property should be one of the following values:

- `ATLASSIAN_CONFLUENCE`
- `ATLASSIAN_JIRA`
- `BASECAMP`
- `BLAMELESS`
- `GITHUB`
- `GITLAB`
- `GOOGLE_CLOUD_PLATFORM`
- `GOOGLE_DRIVE`
- `MICROSOFT_AZURE`
- `MICROSOFT_SHAREPOINT`
- `OPSGENIE`
- `SERVICENOW`
- `OTHER_LINK`

## Team Tags

One or more custom
[tags](https://docs.newrelic.com/docs/new-relic-solutions/new-relic-one/core-concepts/use-tags-help-organize-find-your-data/)
can be added to a New Relic team. Custom team tags are managed using the `tags`
property of the team definition. The `tags` property is optional. When specified
the value must be an array of tag objects, each with the following format:

```json
{
  "[TAG1_NAME]": ["TAG1_VALUE1", "TAG1_VALUE2"],
  "[TAG2_NAME]": ["TAG2_VALUE1", "TAG2_VALUE2"]
}
```

The tag names and values must conform to the
[format and limits](https://docs.newrelic.com/docs/new-relic-solutions/new-relic-one/core-concepts/use-tags-help-organize-find-your-data/#tag-format)
for tags within New Relic.

## Team Definition Example

The following JSON shows an example team definition.

```json
{
  "description": "Engineering team responsible for product development",
  "aliases": ["epd"],
  "members": [
    "fake-user-1@fake-domain-123.com",
    "fake-user-2@fake-domain-123.com"
  ],
  "contacts": [
    {
      "type": "EMAIL",
      "title": "Test email",
      "content": "fake-user-3@fake-domain-123.com"
    }
  ],
  "links": [
    {
      "type": "GITHUB",
      "title": "GitHub Repository",
      "content": "https://github.com/fake-organization-123/fake-repo-123"
    }
  ],
  "tags": {
    "foo": ["bar"],
    "beep": ["boop"]
  }
}
```
