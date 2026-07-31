import { cardClass } from '../lib/styles'

const TECH = [
  {
    name: 'AWS + Terraform + GitHub Actions',
    detail: 'Infrastructure and continuous deploy to an EC2 host on push to main.',
  },
  {
    name: 'Go + Gin',
    detail: 'REST API with MVC-style controllers, services, and models for auth, ranking, and CRUD.',
  },
  {
    name: 'React + Vite + TypeScript',
    detail: 'SPA UI with Tailwind CSS for the Todo, Property Investment, admin, and About pages.',
  },
  {
    name: 'JWT auth',
    detail: 'Admin login for the Users and Jobs management screens.',
  },
  {
    name: 'MySQL 8.4',
    detail: 'Persistent storage for users, jobs, todos, suburbs, and factor metrics.',
  },
  {
    name: 'Docker Compose',
    detail: 'Local and EC2 runtime for the web, API, and database services.',
  },
]

export default function AboutPage() {
  return (
    <>
      <header className="mb-12 text-center">
        <p className="mb-2 text-sm font-medium text-accent">About</p>
        <h1 className="text-5xl font-semibold tracking-tight text-ink">Tony Qiao</h1>
        <p className="mt-2 text-lg text-muted">Full Stack Developer</p>
      </header>

      <section className={`${cardClass} mb-8 px-8 py-10`} aria-labelledby="about-intro-heading">
        <h2
          id="about-intro-heading"
          className="text-center text-2xl font-semibold tracking-tight text-ink"
        >
          Introduction
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[1.05rem] leading-relaxed text-muted">
          I am a business-focused senior full stack engineer with 12+ years of experience building
          scalable web platforms, workflow automation, ERP systems, and API integrations across
          SaaS, finance, telecommunications, and eCommerce. I work across the full delivery
          lifecycle — architecture, estimation, stakeholder communication, mentoring, testing,
          deployment, and production support — and this playground is where I experiment with those
          ideas end to end.
        </p>
      </section>

      <section aria-labelledby="about-tech-heading">
        <h2
          id="about-tech-heading"
          className="text-center text-3xl font-semibold tracking-tight text-ink"
        >
          Tech used in this playground
        </h2>
        <p className="mt-2 text-center text-muted">
          Stack that powers TQ Playground locally and on AWS.
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((item) => (
            <li
              key={item.name}
              className="flex min-h-[11rem] flex-col items-center justify-center rounded-[1.25rem] bg-card px-6 py-8 text-center"
            >
              <p className="text-lg font-semibold tracking-tight text-ink">{item.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
