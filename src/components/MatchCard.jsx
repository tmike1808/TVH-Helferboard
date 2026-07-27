
import { useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import {
  createAssignment,
  deleteAssignment
} from '../services/helperService'

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

  const totalSlots = teamRoles.reduce(
    (sum, role) => sum + role.slots,
    0
  )

  const allFilled =
    gameAssignments.length >= totalSlots

  const statusClass = allFilled
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-orange-100 text-orange-700'

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">

      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >

        <div>

          <div className="text-sm font-bold text-emerald-600 mb-2">
            {new Date(game.start_time).toLocaleDateString('de-DE')}
          </div>

          <h2 className="text-3xl font-black">
            {team?.name || 'Team'} – {game.opponent}
          </h2>

          <p className="text-slate-500 mt-1">
            {team?.category || 'Kategorie'}
          </p>

        </div>

        <div
          className={
            statusClass +
            " px-4 py-3 rounded-2xl font-black"
          }
        >
          {gameAssignments.length} / {totalSlots} besetzt
        </div>

      </div>

      {expanded && (
        <div className="grid grid-cols-5 gap-3 mt-6">

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

    </div>
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

  const open = filled < role.slots

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
        "rounded-2xl p-4 border-2 " +
        (open
          ? "border-orange-400"
          : "border-emerald-500")
      }
    >

      <div className="font-bold text-sm">
        {role.name}
      </div>

      <div className="mt-2 font-black text-xl">
        {filled} / {role.slots}
      </div>

      <div className="space-y-2 mt-3">

        {helpers.map(helper => (
          <div
            key={helper.id}
            className="bg-slate-100 rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-between"
          >

            <span>
              {helper.helper_name}
            </span>

            <button
              onClick={() => handleRemove(helper.id)}
              className="w-7 h-7 rounded-lg bg-red-500 text-white text-xs font-black"
            >
              X
            </button>

          </div>
        ))}

      </div>

      {open && (
        <div className="space-y-2 mt-3">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold"
          >
            {saving ? 'Speichert...' : 'Eintragen'}
          </button>

        </div>
      )}

    </div>
  )
}
