
export default function Topbar({
  title = 'TV Homburg Dashboard',
  subtitle = 'V24 CORE MERGE'
}) {

  return (
    <header className="mb-8">

      <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl">
        {title}
      </h1>

      <p className="text-slate-500 mt-2">
        {subtitle}
      </p>

    </header>
  )
}
