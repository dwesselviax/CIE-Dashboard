import matter from "gray-matter";

export interface ParsedNoteFrontmatter {
  title: string;
  date: string; // YYYY-MM-DD
  type?: string;
  granola_id?: string;
  time?: string;
  attendees: string[];
  source: string;
  link?: string;
}

export interface ParsedNote {
  frontmatter: ParsedNoteFrontmatter;
  body: string;
  sections: Record<string, string>;
  actionItemsText: string[];
}

const ACTION_HEADINGS = [
  "next steps",
  "action items",
  "action items & next steps",
  "action items and next steps",
  "follow-up",
  "follow-ups",
  "follow up",
  "todos",
  "to-dos",
];

export function parseMarkdownNote(raw: string): ParsedNote {
  const { data, content } = matter(raw);

  const frontmatter: ParsedNoteFrontmatter = {
    title: data.title || "Untitled",
    date: typeof data.date === "string" ? data.date : data.date?.toISOString?.()?.slice(0, 10) || "",
    type: data.type,
    granola_id: data.granola_id,
    time: data.time,
    attendees: Array.isArray(data.attendees) ? data.attendees : [],
    source: data.source || "obsidian",
    link: data.link,
  };

  // Parse sections by ## and ### headings
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentSection = "_intro";
  let currentContent: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2 || h3) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = (h2?.[1] || h3?.[1] || "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  // Extract action items from relevant sections
  const actionItemsText: string[] = [];
  for (const [heading, text] of Object.entries(sections)) {
    if (ACTION_HEADINGS.includes(heading.toLowerCase())) {
      const itemLines = text.split("\n").filter((l) => l.match(/^[-*\d.]\s+/));
      actionItemsText.push(...itemLines.map((l) => l.replace(/^[-*\d.]+\s*/, "").trim()));
    }
  }

  return { frontmatter, body: content, sections, actionItemsText };
}
