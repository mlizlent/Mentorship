export type MentorLink = {
  label: string
  handle: string
  url?: string
}

export type FeaturedMentor = {
  id: string
  initials: string
  name: string
  role: string
  detail: string
  accent: string
  location?: string
  photo?: string
  about?: string
  helpTopics?: string[]
  expertise?: string[]
  mentoringStyle?: string
  bestFor?: string[]
  availability?: string
  languages?: string[]
  links?: MentorLink[]
}

export const merolineProfile: FeaturedMentor = {
  id: 'meroline-lizlent',
  initials: 'ML',
  name: 'Meroline Lizlent',
  role: 'Full-stack developer and AI/ML engineer · Co-founder, Malkia Labs',
  detail: 'Kisumu, Kenya',
  accent: 'bg-gradient-to-br from-primary to-primary-container text-on-primary',
  location: 'Kisumu, Kenya',
  photo: '/Thoughtful Software Engineer Portrait.png',
  about:
    "I'm a software engineer who builds web apps and AI/ML tools, and I design the interfaces too. I'm an apprentice software engineer at Zone01 Kisumu and I hold a Bachelor of Technology in Computer and Electronic Systems from Mount Kenya University. I co-founded Malkia Labs because I want more girls and women to see themselves in tech, and to build products that solve real problems for them. I write about what I learn on dev.to, and I'm happy to help you turn confusing topics into clear next steps.",
  helpTopics: [
    'Starting out in web development and choosing what to learn first',
    'Building your first full-stack project and a portfolio you’re proud of',
    'Python, Go, JavaScript, HTML and CSS',
    'UI and UX design for developers',
    'Getting started with AI and machine learning projects',
    'Writing technical posts and sharing your work publicly',
    'Staying consistent when you’re learning and building alongside other commitments',
  ],
  expertise: [
    'Web development',
    'Full-stack',
    'Python',
    'Go',
    'JavaScript',
    'UI/UX design',
    'AI/ML',
    'Technical writing',
  ],
  mentoringStyle:
    "Practical and encouraging. We'll set a small goal, build something real, and review it together. I'll never make you feel silly for asking a question.",
  bestFor: [
    'Are beginners or early in their tech journey',
    'Want to build projects, not just watch tutorials',
    'Are interested in AI or web development',
  ],
  availability: '5 hours per week · East Africa Time (EAT)',
  languages: ['English', 'Kiswahili'],
  links: [
    {
      label: 'LinkedIn',
      handle: 'in/meroline-lizlent',
      url: 'https://www.linkedin.com/in/meroline-lizlent-83a07034b/',
    },
    {
      label: 'GitHub',
      handle: 'mlizlent',
      url: 'https://github.com/mlizlent',
    },
    {
      label: 'Facebook',
      handle: 'Lizzie Wasonga',
    },
    {
      label: 'dev.to',
      handle: 'meroline_lizlent',
      url: 'https://dev.to/meroline_lizlent',
    },
  ],
}

export const featuredMentors: FeaturedMentor[] = [
  merolineProfile,
  {
    id: 'ivy-imoh',
    initials: 'II',
    name: 'Ivy Imoh',
    role: 'Product Designer',
    detail: 'Leading user research and user-centered design.',
    accent: 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary',
  },
  {
    id: 'grace-nyaboke',
    initials: 'GN',
    name: 'Grace Nyaboke',
    role: 'Frontend Development Lead',
    detail:
      'Full stack developer leading frontend architecture and implementation.',
    accent: 'bg-gradient-to-br from-primary to-primary-container text-on-primary',
  },
  {
    id: 'taheera-mohamed',
    initials: 'TM',
    name: 'Taheera Mohamed',
    role: 'Project Manager',
    detail: 'Full stack developer overseeing planning and delivery.',
    accent: 'bg-gradient-to-br from-neutral-700 to-neutral-900 text-white',
  },
  {
    id: 'emmaculate-odhiambo',
    initials: 'EO',
    name: 'Emmaculate Odhiambo',
    role: 'Full Stack Developer',
    detail: 'Backend specialist in Django.',
    accent:
      'bg-gradient-to-br from-secondary-fixed to-secondary-fixed-dim text-secondary',
  },
  {
    id: 'joy-lamka',
    initials: 'JL',
    name: 'Joy Lamka',
    role: 'Backend Developer & Cloud Technologies',
    detail:
      'Focusing on backend development and cloud technologies, with experience in Python, Go, databases and AWS.',
    accent: 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary',
  },
]