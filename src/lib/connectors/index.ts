/**
 * Connector registration — import all connectors and register them.
 *
 * To add a new connector:
 * 1. Create a file (e.g., slack.ts) implementing the Connector interface
 * 2. Import it here
 * 3. Add the registerConnector call
 */
import { registerConnector } from "./registry";
import { jiraConnector } from "./jira";
import { granolaConnector } from "./granola";

export function initializeConnectors(): void {
  registerConnector(jiraConnector);
  registerConnector(granolaConnector);
  // registerConnector(slackConnector);     // Phase 2
  // registerConnector(confluenceConnector); // Phase 4
  // registerConnector(gdriveConnector);     // Phase 4
}

export { getConnector, getAllConnectors, getConnectorTypes } from "./registry";
export type { Connector, ConnectorConfig, SyncResult, NormalizedWorkItem, NormalizedMeetingNote } from "./types";
