import { TextLink } from '../components/TextLink.tsx'

export function NotFoundPage() {
  return (
    <section className="text-center">
      <h1 className="mb-2 text-xl font-semibold">Page not found</h1>
      <p className="mb-4 text-slate-500">There is nothing at this address.</p>
      <TextLink to="/">Go to the home page</TextLink>
    </section>
  )
}
