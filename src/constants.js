import { Code2, FileBadge, Trophy } from "lucide-react";

export const SAMPLE = {
  username: "alex-morgan",
  full_name: "Alex Morgan",
  bio: "Computer science student building thoughtful tools at the intersection of AI, design, and everyday problems. I learn by shipping small things and sharing the receipts.",
  skills: ["React", "Python", "UI/UX", "Machine Learning", "Supabase", "TypeScript", "Tailwind CSS"],
  entries: [
    {
      id: "sample-1",
      title: "StudyFlow — a calmer study planner",
      description: "Built a lightweight planner that turns a syllabus into weekly study sessions. Designed the interface, implemented the responsive app, and tested the flow with classmates.",
      entry_type: "project",
      evidence_url: "https://github.com/alexmorgan/studyflow",
      is_public: true,
      created_at: "2026-09-14T10:00:00Z"
    },
    {
      id: "sample-2",
      title: "Deep Learning Specialization",
      description: "Completed 5 courses covering neural networks, deep learning architectures, CNNs, sequence models, and real-world ML deployment strategies.",
      entry_type: "certificate",
      evidence_url: "https://coursera.org/verify/DL-789211",
      is_public: true,
      created_at: "2026-08-20T14:30:00Z"
    },
    {
      id: "sample-3",
      title: "Campus Buildathon 2026 — 1st Place",
      description: "Collaborated in a three-person team to prototype an accessibility-first campus navigation concept during an intensive 24-hour hackathon.",
      entry_type: "hackathon",
      evidence_url: "https://devpost.com/software/campus-pulse",
      is_public: true,
      created_at: "2026-07-03T18:00:00Z"
    },
    {
      id: "sample-4",
      title: "Distributed Key-Value Store",
      description: "Engineered a fault-tolerant in-memory key-value store in Go implementing the Raft consensus algorithm with snapshotting and dynamic node membership.",
      entry_type: "project",
      evidence_url: "https://github.com/alexmorgan/raft-kv",
      is_public: true,
      created_at: "2026-06-15T09:15:00Z"
    },
    {
      id: "sample-5",
      title: "Campus Tech Club Security Audit",
      description: "Conducted security assessment of student council portal, identifying session-management edge cases and presenting mitigation recommendations to university IT.",
      entry_type: "project",
      evidence_url: "",
      is_public: true,
      created_at: "2026-05-10T11:45:00Z"
    }
  ]
};

export const ENTRY_CONFIG = {
  project: {
    label: "Project",
    icon: Code2,
    badgeClass: "type-project",
    color: "#4f46e5",
    bg: "#eef2ff"
  },
  certificate: {
    label: "Certificate",
    icon: FileBadge,
    badgeClass: "type-certificate",
    color: "#0d9488",
    bg: "#f0fdfa"
  },
  hackathon: {
    label: "Hackathon",
    icon: Trophy,
    badgeClass: "type-hackathon",
    color: "#d97706",
    bg: "#fffbeb"
  }
};

export function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function safeUrl(url) {
  if (!url) return null;
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function getDomain(url) {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function initials(name = "Portivue") {
  if (!name) return "PV";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(x => (x ? x[0] : ""))
    .join("")
    .toUpperCase() || "PV";
}

export function dateLabel(value) {
  if (!value) return "Recently added";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  } catch {
    return "Recently added";
  }
}
