import type { PortfolioEntry, Profile } from '../types/portfolio';

const demoUserId = '00000000-0000-0000-0000-000000000000';

export const DEMO_PROFILE: Profile = {
  id: demoUserId,
  full_name: 'Arjun Shrivastava',
  username: 'arjun-shrivastava',
  bio: 'Computer science student exploring web development, thoughtful design, and useful digital products.',
  skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Python', 'UI/UX Design'],
  avatar_url: null,
  is_public: true,
  created_at: '2025-01-15T10:00:00.000Z',
  updated_at: '2025-02-10T14:30:00.000Z',
};

const demoDate = '2025-02-10T14:30:00.000Z';

function demoEntry(
  id: string,
  title: string,
  description: string,
  outcome: string,
  category: PortfolioEntry['category'],
  evidenceUrl: string | null = null,
  evidenceType: string | null = null,
): PortfolioEntry {
  return {
    id,
    user_id: demoUserId,
    title,
    description,
    outcome,
    category,
    evidence_url: evidenceUrl,
    evidence_type: evidenceType,
    is_published: true,
    created_at: demoDate,
    updated_at: demoDate,
  };
}

export const DEMO_ENTRIES: PortfolioEntry[] = [
  demoEntry(
    'demo-entry-1',
    'Personal Portfolio Website',
    'Designed and built a responsive personal portfolio to introduce my work, interests, and current skills.',
    'Published a responsive site to showcase projects and practice front-end development.',
    'Projects',
  ),
  demoEntry(
    'demo-entry-2',
    'AI Study Assistant Prototype',
    'Created a student-focused prototype that organizes study notes and suggests simple revision prompts.',
    'Built an interactive prototype and learned to turn study needs into product features.',
    'Projects',
  ),
  demoEntry(
    'demo-entry-3',
    'Sample course: freeCodeCamp Responsive Web Design',
    'Example learning resource covering responsive page layout, HTML, and CSS. This sample entry does not claim Arjun completed or earned the certification.',
    'Course information: explore the curriculum and requirements on freeCodeCamp.',
    'Certificates',
    'https://www.freecodecamp.org/learn/',
    'Course information—not certificate evidence',
  ),
  demoEntry(
    'demo-entry-4',
    'Sample course: Google UX Design Certificate',
    'Example professional certificate program covering UX research, wireframing, and interface design. This sample entry does not claim Arjun completed or earned the certificate.',
    'Course information: review the program details and requirements on Coursera.',
    'Certificates',
    'https://www.coursera.org/professional-certificates/google-ux-design',
    'Course information—not certificate evidence',
  ),
  demoEntry(
    'demo-entry-7',
    'Sample course: CS50 Introduction to Computer Science',
    'Example Harvard CS50 course covering programming, algorithms, and computer science fundamentals. This sample entry does not claim Arjun completed or earned a certificate.',
    'Course information: explore the syllabus and learning materials on the official CS50 site.',
    'Certificates',
    'https://cs50.harvard.edu/x/2025/',
    'Course information—not certificate evidence',
  ),
  demoEntry(
    'demo-entry-5',
    'Smart Campus Challenge',
    'Collaborated on a student concept for making campus events and useful resources easier to discover.',
    'Presented a team concept focused on improving access to campus information.',
    'Hackathons',
  ),
  demoEntry(
    'demo-entry-6',
    'Peer Choice — Campus Challenge',
    'Received a peer-choice mention for clear presentation and teamwork during a sample campus project showcase.',
    'Recognized in this sample showcase for clear communication and collaboration.',
    'Achievements',
  ),
];
