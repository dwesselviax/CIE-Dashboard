import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEAM = [
  { name: "Lucas Seidenfus", email: "lseidenfus@viax.io", role: "Engineering Manager", viewScope: "team", customers: ["2U"] },
  { name: "Akash Devgan", email: "adevgan@viax.io", role: "Frontend Engineer", viewScope: "team", customers: ["Solventum"] },
  { name: "Vishnu Anisetti", email: "vanisetti@viax.io", role: "DevOps Engineer", viewScope: "team", customers: ["Stryker"] },
  { name: "Rick Chavie", email: "rchavie@viax.io", role: "CEO", viewScope: "leadership", customers: ["Boston Scientific", "Strategym"] },
  { name: "Brian Diehl", email: "bdiehl@viax.io", role: "Head of Partnerships & Strategy", viewScope: "leadership", customers: ["Solventum", "Shopify"] },
  { name: "Andrew Martin", email: "amartin@viax.io", role: "COO", viewScope: "leadership", customers: ["Solventum", "2U"] },
  { name: "Vova Zubyk", email: "vzubyk@viax.io", role: "Backend Engineer", viewScope: "team", customers: ["Zaelab"] },
  { name: "Francisco Santana", email: "fsantana@viax.io", role: "Backend Engineer", viewScope: "team", customers: ["Boston Scientific"] },
  { name: "Doug Wessel", email: "dwessel@viax.io", role: "Head of Co-Innovation Engineering", viewScope: "manager", customers: [] },
];

const CUSTOMERS = [
  { name: "Solventum", connectionStatus: "active" },
  { name: "2U", connectionStatus: "active" },
  { name: "Boston Scientific", connectionStatus: "active" },
  { name: "Stryker", connectionStatus: "active" },
  { name: "Shopify", connectionStatus: "active" },
  { name: "Zaelab", connectionStatus: "active" },
  { name: "Strategym", connectionStatus: "discovery" },
];

const WORK_ITEMS = [
  { sourceId: "CIE-101", memberEmail: "lseidenfus@viax.io", customer: "2U", title: "Documentation deprecation workflow", status: "In Progress", priority: "High", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 3 },
  { sourceId: "CIE-102", memberEmail: "lseidenfus@viax.io", customer: "2U", title: "Tool selection — blocked on Propello", status: "Blocked", priority: "Critical", source: "jira-internal", isBlocker: true, blockerDescription: "Propello unavailable for over a week — hard dependency for tool selection decisions", daysInStatus: 8 },
  { sourceId: "CIE-103", memberEmail: "lseidenfus@viax.io", customer: "2U", title: "Demo server testing with product determination", status: "To Do", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 1 },
  { sourceId: "CIE-104", memberEmail: "adevgan@viax.io", customer: "Solventum", title: "Configuration rules implementation", status: "In Progress", priority: "High", source: "jira-customer", isBlocker: false, blockerDescription: null, daysInStatus: 5 },
  { sourceId: "CIE-105", memberEmail: "adevgan@viax.io", customer: "Solventum", title: "MedSurgery integration check-in prep", status: "Done", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 0 },
  { sourceId: "CIE-106", memberEmail: "vanisetti@viax.io", customer: "Stryker", title: "MSP knowledge transfer — Enterprise Apps", status: "In Progress", priority: "High", source: "jira-customer", isBlocker: false, blockerDescription: null, daysInStatus: 2 },
  { sourceId: "CIE-107", memberEmail: "vanisetti@viax.io", customer: "Stryker", title: "eComm & Payment KT session follow-ups", status: "To Do", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 4 },
  { sourceId: "CIE-108", memberEmail: "rchavie@viax.io", customer: "Boston Scientific", title: "Monthly catch-up action items", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 3 },
  { sourceId: "CIE-109", memberEmail: "rchavie@viax.io", customer: "Boston Scientific", title: "Stakeholder access — blocked by middle mgmt", status: "Blocked", priority: "High", source: "jira-customer", isBlocker: true, blockerDescription: "Limited business stakeholder access due to middle management resistance", daysInStatus: 14 },
  { sourceId: "CIE-110", memberEmail: "bdiehl@viax.io", customer: "Solventum", title: "Frontend review action items", status: "In Progress", priority: "High", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 1 },
  { sourceId: "CIE-111", memberEmail: "bdiehl@viax.io", customer: "Shopify", title: "Fuse Integration Hub showcase follow-up", status: "To Do", priority: "Low", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 6 },
  { sourceId: "CIE-112", memberEmail: "amartin@viax.io", customer: "Solventum", title: "Bi-weekly sync action items", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 2 },
  { sourceId: "CIE-113", memberEmail: "amartin@viax.io", customer: "2U", title: "edX subscriptions timeline review", status: "Blocked", priority: "High", source: "jira-customer", isBlocker: true, blockerDescription: "Waiting on 2U team for timeline confirmation — no response in 5 days", daysInStatus: 5 },
  { sourceId: "CIE-114", memberEmail: "vzubyk@viax.io", customer: "Zaelab", title: "Monthly Solventum sync via Zaelab", status: "Done", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 0 },
  { sourceId: "CIE-115", memberEmail: "fsantana@viax.io", customer: "Boston Scientific", title: "SAP ERP upgrade simplification research", status: "In Progress", priority: "Medium", source: "jira-internal", isBlocker: false, blockerDescription: null, daysInStatus: 7 },
  { sourceId: "CIE-116", memberEmail: "fsantana@viax.io", customer: "Boston Scientific", title: "Enterprise integration strategy — AI connectors", status: "To Do", priority: "High", source: "jira-customer", isBlocker: false, blockerDescription: null, daysInStatus: 3 },
];

async function main() {
  // 1. Seed team members
  for (const member of TEAM) {
    await prisma.teamMember.upsert({
      where: { email: member.email },
      update: { name: member.name, role: member.role, viewScope: member.viewScope },
      create: { name: member.name, email: member.email, role: member.role, viewScope: member.viewScope },
    });
  }
  console.log(`Seeded ${TEAM.length} team members`);

  // 2. Seed customers
  for (const cust of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { id: (await prisma.customer.findFirst({ where: { name: cust.name } }))?.id ?? "00000000-0000-0000-0000-000000000000" },
      update: { connectionStatus: cust.connectionStatus },
      create: { name: cust.name, connectionStatus: cust.connectionStatus },
    });
  }
  console.log(`Seeded ${CUSTOMERS.length} customers`);

  // 3. Seed work items
  // Build lookup maps
  const membersByEmail = new Map<string, { id: string }>();
  for (const m of TEAM) {
    const row = await prisma.teamMember.findUnique({ where: { email: m.email } });
    if (row) membersByEmail.set(m.email, row);
  }
  const customersByName = new Map<string, { id: string }>();
  for (const c of CUSTOMERS) {
    const row = await prisma.customer.findFirst({ where: { name: c.name } });
    if (row) customersByName.set(c.name, row);
  }

  // 3. Seed customer assignments (M2M)
  for (const member of TEAM) {
    const memberRow = membersByEmail.get(member.email);
    if (!memberRow || member.customers.length === 0) continue;
    for (const custName of member.customers) {
      const custRow = customersByName.get(custName);
      if (!custRow) continue;
      await prisma.teamMemberCustomer.upsert({
        where: { teamMemberId_customerId: { teamMemberId: memberRow.id, customerId: custRow.id } },
        update: {},
        create: { teamMemberId: memberRow.id, customerId: custRow.id },
      });
    }
  }
  console.log("Seeded customer assignments");

  // 4. Seed work items
  for (const wi of WORK_ITEMS) {
    const member = membersByEmail.get(wi.memberEmail);
    const customer = customersByName.get(wi.customer);
    const updatedAt = new Date(Date.now() - wi.daysInStatus * 86400000);

    await prisma.workItem.upsert({
      where: { source_sourceId: { source: wi.source, sourceId: wi.sourceId } },
      update: {
        title: wi.title,
        status: wi.status,
        priority: wi.priority,
        isBlocker: wi.isBlocker,
        blockerDescription: wi.blockerDescription,
        teamMemberId: member?.id ?? null,
        customerId: customer?.id ?? null,
        updatedAt,
      },
      create: {
        source: wi.source,
        sourceId: wi.sourceId,
        title: wi.title,
        status: wi.status,
        priority: wi.priority,
        isBlocker: wi.isBlocker,
        blockerDescription: wi.blockerDescription,
        teamMemberId: member?.id ?? null,
        customerId: customer?.id ?? null,
        updatedAt,
      },
    });
  }
  console.log(`Seeded ${WORK_ITEMS.length} work items`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
