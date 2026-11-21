// Identity, links and SEO. Edit here; every section reads from these files.

export const site = {
  name: 'Md. Rashed Miah',
  shortName: 'Rashed Miah',
  url: 'https://rashed9810.github.io',
  role: 'Software Engineer and aspiring AI/ML researcher',
  location: 'Dhaka, Bangladesh',
  // Used for <title>, meta description and social cards.
  title: 'Md. Rashed Miah — Software Engineer & AI/ML Researcher',
  description:
    'Software engineer in Dhaka working toward research on reliable, verifiable language-model systems, with a background in medical image analysis. Projects, research work, experience and CV.',
  email: 'rashed.bcse.edu@gmail.com',
  cv: '/cv/Md-Rashed-Miah-CV.pdf',
  // Square photos. `avatar` is a tighter head crop for small circles.
  portrait: {
    src: '/img/portrait-320.webp',
    src2x: '/img/portrait-640.webp',
    alt: 'Md. Rashed Miah in glasses, a navy blazer and white shirt, in an office',
  },
  avatar: {
    src: '/img/avatar-128.webp',
    src2x: '/img/avatar-256.webp',
  },
};

export type Link = { label: string; href: string; icon?: IconName };

export const socials: Link[] = [
  { label: 'GitHub', href: 'https://github.com/rashed9810', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rashed9810/', icon: 'linkedin' },
  { label: 'Hugging Face', href: 'https://huggingface.co/rashed9810' },
];

// Add these when they exist — the Contact section shows them automatically.
// e.g. { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=...' }
//      { label: 'ORCID', href: 'https://orcid.org/0000-0000-0000-0000' }
export const academicProfiles: Link[] = [];

export const nav = [
  { label: 'Research', href: '#research' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Learn Go', href: '/go/' },
  { label: 'Contact', href: '#contact' },
];

export type IconName =
  | 'github' | 'linkedin' | 'mail' | 'download' | 'external' | 'arrow-up' | 'lock' | 'check'
  | 'menu' | 'x' | 'pin' | 'code' | 'cpu' | 'message' | 'scan' | 'server' | 'layout'
  | 'database' | 'box' | 'file';
