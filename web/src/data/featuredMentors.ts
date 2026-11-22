export type FeaturedMentor = {
  initials: string
  name: string
  role: string
  detail: string
  accent: string
}

export const featuredMentors: FeaturedMentor[] = [
  {
    initials: 'ML',
    name: 'Meroline Lizlent',
    role: 'SEO Specialist, Full Stack Developer & AI/ML Engineer',
    detail: 'Focusing on frontend development and product design.',
    accent: 'bg-gradient-to-br from-primary to-primary-container text-on-primary',
  },
  {
    initials: 'II',
    name: 'Ivy Imoh',
    role: 'Product Designer',
    detail: 'Leading user research and user-centered design.',
    accent: 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary',
  },
  {
    initials: 'GN',
    name: 'Grace Nyaboke',
    role: 'Frontend Development Lead',
    detail:
      'Full stack developer leading frontend architecture and implementation.',
    accent: 'bg-gradient-to-br from-primary to-primary-container text-on-primary',
  },
  {
    initials: 'TM',
    name: 'Taheera Mohamed',
    role: 'Project Manager',
    detail: 'Full stack developer overseeing planning and delivery.',
    accent: 'bg-gradient-to-br from-neutral-700 to-neutral-900 text-white',
  },
  {
    initials: 'EO',
    name: 'Emmaculate Odhiambo',
    role: 'Full Stack Developer',
    detail: 'Backend specialist in Django.',
    accent:
      'bg-gradient-to-br from-secondary-fixed to-secondary-fixed-dim text-secondary',
  },
  {
    initials: 'JL',
    name: 'Joy Lamka',
    role: 'Backend Developer & Cloud Technologies',
    detail:
      'Focusing on backend development and cloud technologies, with experience in Python, Go, databases and AWS.',
    accent: 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary',
  },
]