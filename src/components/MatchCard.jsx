
import { useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import {
  createAssignment,
  deleteAssignment
} from '../services/helperService'
import {
  formatGameDate,
  formatGameTime
} from '../utils/formatDateTime'
import {
  formatGameStaffingStatus,
  formatRoleStaffingStatus,
  getGameStaffingStatus,
  getRoleStaffingStatus,
  STAFFING_STATUS
} from '../utils/staffingStatus'

export default function MatchCard({ game }) {

  const [expanded, setExpanded] = useState(false)

  const {
    teams,
    roles,
    assignments,
    reloadAssignments
  } = useDashboardStore()

  const team = teams.find(
    t => t.id === game.team_id
  )

  const teamRoles = roles.filter(
    r => r.category === team?.category
  ).sort((a,b)=>a.order_index-b.order_index)

  const gameAssignments = assignments.filter(
    a => a.game_id === game.id
  )

  const staffingStatus = getGameStaffingStatus(teamRoles, gameAssignments)
  const statusClass = staffingStatus.status !== STAFFING_STATUS.NEEDS_STAFF
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-orange-100 text-orange-700'

  return (
    <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      <button
        type="button"
        className="flex w-full min-w-0 flex-col items-start justify-between gap-4 text-left sm:flex-row"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >

        <div className="w-full min-w-0 max-w-full">

          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-emerald-700">
            <span>{formatGameDate(game.start_time)}</span>
            <span>{formatGameTime(game.start_time)}</span>
          </div>

          <h2 className="break-words text-xl font-black leading-tight sm:text-2xl lg:text-3xl">
            {team?.name || 'Team'} – {game.opponent}
          </h2>

          <p className="text-slate-500 mt-1">
            {team?.category || 'Kategorie'}
          </p>

        </div>

        <span
          className={
            statusClass +
            " max-w-full break-words rounded-2xl px-4 py-3 text-center text-sm font-black sm:max-w-xs sm:shrink-0 sm:text-base"
          }
        >
          {formatGameStaffingStatus(staffingStatus)}
        </span>

      </button>

      {expanded && (
        <div className="mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

          {teamRoles.map(role => {

            const roleAssignments =
              gameAssignments.filter(
                a => a.role_id === role.id
              )

            return (
              <RoleCard
                key={role.id}
                role={role}
                game={game}
                filled={roleAssignments.length}
                helpers={roleAssignments}
                reloadAssignments={reloadAssignments}
              />
            )
          })}

        </div>
      )}

    </article>
  )
}

function RoleCard({
  role,
  game,
  filled,
  helpers,
  reloadAssignments
}) {

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const staffingStatus = getRoleStaffingStatus(role, filled)
  const open = staffingStatus.openSlots > 0
  const viable = staffingStatus.status !== STAFFING_STATUS.NEEDS_STAFF

  async function handleSave() {

    const helperName = name.trim()
    if (!helperName || !open) return
    const exists = helpers.some(h=>h.helper_name.trim().toLowerCase()===helperName.toLowerCase())
    if (exists) return

    setSaving(true)
    try {
    await createAssignment({
      game_id: game.id,
      role_id: role.id,
      helper_name: helperName
    })

    await reloadAssignments()
    setName('')
    } catch(err){
      alert('Speichern fehlgeschlagen.')
      console.error(err)
    }
    setSaving(false)
  }

  async function handleRemove(id) {

    try {
      await deleteAssignment(id)
      await reloadAssignments()
    } catch(err){alert('Löschen fehlgeschlagen.');console.error(err)}
  }

  return (
    <div
      className={
        "min-w-0 rounded-2xl border-2 p-3 min-[380px]:p-2 sm:p-4 " +
        (viable
          ? "border-emerald-500"
          : "border-orange-400")
      }
    >

      <div className="break-words text-sm font-bold leading-5">
        {role.name}
      </div>

      <div
        className={
          "mt-2 break-words text-sm font-black leading-5 " +
          (viable ? "text-emerald-700" : "text-orange-700")
        }
      >
        {formatRoleStaffingStatus(staffingStatus)}
      </div>

      <div className="space-y-2 mt-3">

        {helpers.map(helper => (
          <div
            key={helper.id}
            className="flex min-w-0 items-center gap-1 rounded-xl bg-slate-100 px-1.5 py-2 text-sm font-bold"
          >

            <span className="min-w-0 flex-1 break-words leading-5">
              {helper.helper_name}
            </span>

            <button
              type="button"
              onClick={() => handleRemove(helper.id)}
              aria-label={`${helper.helper_name} austragen`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-2xl font-bold leading-none text-white outline-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">×</span>
            </button>

          </div>
        ))}

      </div>

      {open && (
        <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-1.5">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-label={saving
              ? 'Helfereintrag wird gespeichert'
              : 'Als Helfer eintragen'}
            aria-busy={saving}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-2xl font-bold leading-none text-white outline-none hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-emerald-400"
          >
            <span aria-hidden="true">{saving ? '…' : '✓'}</span>
          </button>

        </div>
      )}

    </div>
  )
}
