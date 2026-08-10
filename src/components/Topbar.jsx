
const DASHBOARD_TITLE = 'TV 1878 Homburg Handball - Dashboard'
const DASHBOARD_SUBTITLE = 'Gemeinsam. Leidenschaft. Teamgeist. Für Homburg.'

export default function Topbar({
  title = DASHBOARD_TITLE,
  subtitle = DASHBOARD_SUBTITLE
}) {
  const showDashboardHeart = title === DASHBOARD_TITLE
    && subtitle === DASHBOARD_SUBTITLE

  return (
    <header className="mb-6 min-w-0 sm:mb-8">

      <h1 className="break-words text-2xl font-black text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h1>

      <p className="mt-2 break-words text-[#667085]">
        {subtitle}
        {showDashboardHeart && (
          <>
            <span className="sr-only"> Herz</span>
            <span aria-hidden="true" className="ml-1 text-[#8B1E2D]">♥</span>
          </>
        )}
      </p>

    </header>
  )
}
