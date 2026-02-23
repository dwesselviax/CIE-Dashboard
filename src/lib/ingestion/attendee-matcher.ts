import { PrismaClient } from "@prisma/client";

// Static alias map: attendee username (lowercased) → viax email
const ALIAS_MAP: Record<string, string> = {
  dwessel: "dwessel@viax.io",
  "doug wessel": "dwessel@viax.io",
  amartin: "amartin@viax.io",
  "andrew martin": "amartin@viax.io",
  lseidenfus: "lseidenfus@viax.io",
  adevgan: "adevgan@viax.io",
  vanisetti: "vanisetti@viax.io",
  rchavie: "rchavie@viax.io",
  bdiehl: "bdiehl@viax.io",
  brian: "bdiehl@viax.io",
  vzubyk: "vzubyk@viax.io",
  "volodymyr zubyk": "vzubyk@viax.io",
  fsantana: "fsantana@viax.io",
  frsantana: "fsantana@viax.io", // known variant in Granola
  psampson: "psampson@viax.io",
  pat: "psampson@viax.io",
  slysach: "slysach@viax.io",
  apopelo: "apopelo@viax.io",
  dgolovaty: "dgolovaty@viax.io",
  lramponi: "lramponi@viax.io",
  rkovinko: "rkovinko@viax.io",
  amarchuk: "amarchuk@viax.io",
  astelmashenko: "astelmashenko@viax.io",
  ayevdokimov: "ayevdokimov@viax.io",
  mandrosovych: "mandrosovych@viax.io",
  opikuza: "opikuza@viax.io",
  "oleksandr pikuza": "opikuza@viax.io",
  pantoniuk: "pantoniuk@viax.io",
  sgrebeniukov: "sgrebeniukov@viax.io",
  yosmachko: "yosmachko@viax.io",
};

export interface MatchedAttendee {
  email: string;
  teamMemberId: string;
}

interface TeamMemberRow {
  id: string;
  email: string;
}

let cachedMembers: TeamMemberRow[] | null = null;

async function loadTeamMembers(prisma: PrismaClient): Promise<TeamMemberRow[]> {
  if (cachedMembers) return cachedMembers;
  cachedMembers = await prisma.teamMember.findMany({ select: { id: true, email: true } });
  return cachedMembers;
}

export async function matchAttendees(
  attendeeNames: string[],
  prisma: PrismaClient
): Promise<MatchedAttendee[]> {
  const members = await loadTeamMembers(prisma);
  const matched: MatchedAttendee[] = [];

  for (const name of attendeeNames) {
    const lower = name.toLowerCase().trim();

    // Try alias map first
    let email = ALIAS_MAP[lower];

    // Fall back to matching against email prefixes
    if (!email) {
      const member = members.find(
        (m) => m.email.split("@")[0].toLowerCase() === lower
      );
      if (member) email = member.email;
    }

    if (email) {
      const member = members.find((m) => m.email === email);
      if (member && !matched.some((m) => m.email === email)) {
        matched.push({ email: member.email, teamMemberId: member.id });
      }
    }
  }

  return matched;
}

export function clearCache() {
  cachedMembers = null;
}
