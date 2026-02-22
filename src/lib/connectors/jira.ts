import type {
  Connector,
  ConnectorConfig,
  ConnectionTestResult,
  SyncResult,
  NormalizedWorkItem,
  ConnectorSettingsSchema,
} from "./types";

/**
 * Jira Cloud connector.
 *
 * Works for both internal and customer Jira instances —
 * the difference is in the ConnectorConfig (URL, credentials, project keys).
 * Adding a new customer Jira = creating a new ConnectorConfig, not new code.
 */
export const jiraConnector: Connector = {
  type: "jira",
  label: "Jira Cloud",
  description: "Sync issues, sprints, and blockers from a Jira Cloud instance",

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const { instanceUrl, projectKeys } = config.settings as {
      instanceUrl: string;
      projectKeys: string[];
    };

    try {
      // TODO: Replace with actual Jira REST API call
      // GET {instanceUrl}/rest/api/3/myself
      const response = await fetch(`${instanceUrl}/rest/api/3/myself`, {
        headers: {
          Authorization: `Basic ${config.vaultSecretId}`, // resolved from Vault
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return { success: false, message: `Auth failed: ${response.status}` };
      }

      return {
        success: true,
        message: `Connected to ${instanceUrl} — ${projectKeys.length} project(s)`,
      };
    } catch (err) {
      return {
        success: false,
        message: `Connection failed: ${(err as Error).message}`,
      };
    }
  },

  async sync(config: ConnectorConfig): Promise<SyncResult> {
    const start = Date.now();
    const { instanceUrl, projectKeys, teamMemberMapping } = config.settings as {
      instanceUrl: string;
      projectKeys: string[];
      teamMemberMapping: Record<string, string>; // jiraAccountId → viax email
    };

    const workItems: NormalizedWorkItem[] = [];
    const errors: SyncResult["errors"] = [];

    for (const projectKey of projectKeys) {
      try {
        // TODO: Replace with actual Jira search
        // POST {instanceUrl}/rest/api/3/search
        // JQL: project = {projectKey} AND assignee in (...)
        const jql = `project = ${projectKey} AND updated >= -7d ORDER BY updated DESC`;

        const response = await fetch(`${instanceUrl}/rest/api/3/search`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${config.vaultSecretId}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            jql,
            maxResults: 100,
            fields: [
              "summary",
              "description",
              "status",
              "priority",
              "assignee",
              "labels",
              "updated",
            ],
          }),
        });

        if (!response.ok) {
          errors.push({
            message: `Failed to fetch project ${projectKey}: ${response.status}`,
            recoverable: true,
          });
          continue;
        }

        const data = await response.json();

        for (const issue of data.issues ?? []) {
          const assigneeId = issue.fields?.assignee?.accountId;
          const memberEmail = teamMemberMapping[assigneeId];

          if (!memberEmail) continue; // skip issues not assigned to our team

          const isBlocker = (issue.fields?.labels ?? []).includes("blocker");

          workItems.push({
            sourceId: issue.key,
            source: config.id.startsWith("customer-") ? "jira-customer" : "jira-internal",
            sourceUrl: `${instanceUrl}/browse/${issue.key}`,
            teamMemberEmail: memberEmail,
            customerName: config.name.replace(" Jira", ""),
            title: issue.fields?.summary ?? "Untitled",
            description: issue.fields?.description ?? undefined,
            status: issue.fields?.status?.name ?? "Unknown",
            priority: issue.fields?.priority?.name ?? "Medium",
            isBlocker,
            rawData: issue,
          });
        }
      } catch (err) {
        errors.push({
          message: `Error syncing project ${projectKey}: ${(err as Error).message}`,
          recoverable: true,
        });
      }
    }

    return {
      workItems,
      meetingNotes: [],
      errors,
      metadata: {
        itemsFetched: workItems.length,
        duration: Date.now() - start,
      },
    };
  },

  getSettingsSchema(): ConnectorSettingsSchema {
    return {
      fields: [
        {
          key: "instanceUrl",
          label: "Jira Instance URL",
          type: "url",
          required: true,
          description: "e.g., https://your-org.atlassian.net",
        },
        {
          key: "projectKeys",
          label: "Project Keys",
          type: "text",
          required: true,
          description: "Comma-separated Jira project keys (e.g., CIE, PLAT)",
        },
        {
          key: "authMethod",
          label: "Authentication",
          type: "select",
          required: true,
          options: [
            { label: "API Token (Basic Auth)", value: "basic" },
            { label: "OAuth 2.0", value: "oauth" },
          ],
        },
      ],
    };
  },
};
