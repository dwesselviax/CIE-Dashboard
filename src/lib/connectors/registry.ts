import type { Connector } from "./types";

/**
 * Connector Registry — the single place all connector types are registered.
 *
 * Adding a new data source:
 * 1. Implement the Connector interface in a new file (e.g., slack.ts)
 * 2. Import and register it here
 * 3. Configure an instance via the admin UI
 *
 * That's it. No page changes, no schema migrations for the basics.
 */

const connectors = new Map<string, Connector>();

export function registerConnector(connector: Connector): void {
  if (connectors.has(connector.type)) {
    throw new Error(`Connector type "${connector.type}" is already registered`);
  }
  connectors.set(connector.type, connector);
}

export function getConnector(type: string): Connector | undefined {
  return connectors.get(type);
}

export function getAllConnectors(): Connector[] {
  return Array.from(connectors.values());
}

export function getConnectorTypes(): string[] {
  return Array.from(connectors.keys());
}
