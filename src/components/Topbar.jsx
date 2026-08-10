
export default function Topbar({
  title = 'TV Homburg Dashboard',
  subtitle = 'V24 CORE MERGE'
}) {

  return (
    <header className="mb-6 min-w-0 sm:mb-8">

      <h1 className="break-words text-2xl font-black sm:text-4xl lg:text-5xl">
        {title}
      </h1>

      <p className="mt-2 break-words text-slate-500">
        {subtitle}
      </p>

    </header>
  )
}
