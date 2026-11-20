import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-ink mb-4">
          Malkia Mentor
        </h1>
        <p className="text-primary-600 text-lg font-medium mb-8">
          Crowning African tech.
        </p>
        <p className="text-neutral-600 text-lg mb-10 max-w-lg mx-auto">
          Mentorship for girls and women in tech. Find mentors, track goals,
          and grow your career with support from the Malkia Labs community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="px-8 py-3 bg-primary-600 text-white rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors">
            Sign up as Mentee
          </Link>
          <Link
            to="/register?role=mentor"
            className="px-8 py-3 border border-primary-600 text-primary-600 rounded-lg text-lg font-medium hover:bg-primary-50 transition-colors"
          >
            Sign up as Mentor
          </Link>
        </div>
      </div>
    </div>
  )
}
