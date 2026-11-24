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
    role: 'Software Engineer and Product Designer',
    detail: 'Kisumu, Kenya',
    accent: 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary',
    location: 'Kisumu, Kenya',
    about:
      'Ivy has been a mentor since 2021, mentoring girls from her village from as young as 13. She is a Youth Mental Health First Aider and community leader. Ivy is passionate about elevating the lives of those around her and she holds a Bachelor’s Degree in Forensic Biology. She enjoys reading self-help books and playing chess. Ivy is the author of Outside the Margins and the founder of Kisumu Explorers, a touring, hiking and adventures company operating in Kisumu.',
    helpTopics: [
      'Getting started with software engineering and product design',
      'Building confidence and finding your voice as a young woman in tech',
      'Balancing learning, community work and personal growth',
      'Turning ideas into real products and community initiatives',
    ],
    expertise: [
      'Software Engineering',
      'Product Design',
      'Mentorship',
      'Community Leadership',
      'Youth Mental Health First Aid',
    ],
    mentoringStyle:
      'Warm, patient and community-rooted. I meet you where you are and help you grow one small, steady step at a time.',
    bestFor: [
      'Are young women beginning their journey in tech',
      'Want encouragement alongside practical guidance',
      'Are looking for a mentor who understands community challenges',
    ],
    availability: 'Flexible hours · East Africa Time (EAT)',
    languages: ['English', 'Kiswahili'],
  },
  {
    id: 'grace-nyaboke',
    initials: 'NG',
    name: 'Nyaboke Grace',
    role: 'Software Engineer & Digital Marketing Professional',
    detail: 'Kenya',
    accent: 'bg-gradient-to-br from-primary to-primary-container text-on-primary',
    location: 'Kenya',
    about:
      'Nyaboke Grace is a creative and forward-thinking professional with an interest in technology, digital innovation, and brand development. Her work brings together software engineering, creativity, and digital marketing, with a focus on building meaningful digital experiences and helping ideas grow into impactful solutions. Beyond her work in technology, she is passionate about digital communication, content strategy, and creating engaging online experiences that connect brands with their audiences. She enjoys exploring new ideas, approaching challenges creatively, and working at the intersection of technology and business. At Malkia Labs, she contributes a blend of technical perspective, creativity, and strategic thinking, helping shape ideas into solutions that create value and make an impact.',
    helpTopics: [
      'Getting started with software engineering and digital marketing',
      'Building digital experiences that connect with real audiences',
      'Content strategy and brand development fundamentals',
      'Working at the intersection of technology and business',
    ],
    expertise: [
      'Software Engineering',
      'Digital Marketing',
      'Content Strategy',
      'Brand Development',
      'Digital Communication',
    ],
    mentoringStyle:
      'Creative and collaborative. I like to explore ideas together, approach challenges from fresh angles, and connect technical work with real-world impact.',
    bestFor: [
      'Are curious about both technology and marketing',
      'Want to build engaging digital experiences',
      'Are exploring the intersection of tech and business',
    ],
    availability: 'Flexible hours · East Africa Time (EAT)',
    languages: ['English', 'Kiswahili'],
  },
  {
    id: 'taheera-mohamed',
    initials: 'TM',
    name: 'Taheera Mohamed',
    role: 'Software Developer · Data & AI Enthusiast · Social Impact Advocate',
    detail: 'Kenya',
    accent: 'bg-gradient-to-br from-neutral-700 to-neutral-900 text-white',
    location: 'Kenya',
    about:
      'Taheera Mohamed is a software developer and aspiring computer scientist, and a data and AI enthusiast and social impact advocate. She is passionate about technology, innovation, and building solutions that make a difference, with interests in software engineering, data analytics, artificial intelligence, and the intersection of technology and human development. She enjoys exploring ideas, solving problems, learning new technologies, and turning concepts into practical solutions. Beyond tech, she is passionate about leadership, entrepreneurship, community development, and creating opportunities that empower others. A lifelong learner, curious thinker, and ambitious builder committed to continuous growth, meaningful impact, and becoming better at what she does every day.',
    helpTopics: [
      'Getting started with software engineering, data analytics and AI',
      'Turning concepts into practical, real-world solutions',
      'Building a growth mindset and learning continuously',
      'Leadership, entrepreneurship and community development',
    ],
    expertise: [
      'Software Engineering',
      'Data Analytics',
      'Artificial Intelligence',
      'Leadership',
      'Entrepreneurship',
      'Community Development',
    ],
    mentoringStyle:
      'Curious and encouraging. I love learning alongside my mentees, solving problems together, and celebrating progress at every step.',
    bestFor: [
      'Are curious thinkers who love to learn',
      'Are interested in software, data or AI',
      'Want to grow into leadership and community impact',
    ],
    availability: 'Flexible hours · East Africa Time (EAT)',
    languages: ['English'],
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