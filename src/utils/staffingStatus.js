export const STAFFING_STATUS = Object.freeze({
  NEEDS_STAFF: 'NEEDS_STAFF',
  VIABLE: 'VIABLE',
  FULL: 'FULL'
})

export function getRoleStaffingStatus(role, assignmentCount) {
  const slots = toPositiveInteger(role?.slots)
  const configuredMinimum = toPositiveInteger(role?.minimum_staff)
  const minimumStaff = configuredMinimum > 0 && configuredMinimum <= slots
    ? configuredMinimum
    : slots
  const filledSlots = toNonNegativeInteger(assignmentCount)
  const openSlots = Math.max(slots - filledSlots, 0)
  const neededForMinimum = Math.max(minimumStaff - filledSlots, 0)

  let status = STAFFING_STATUS.NEEDS_STAFF

  if (slots > 0 && filledSlots >= slots) {
    status = STAFFING_STATUS.FULL
  } else if (minimumStaff > 0 && filledSlots >= minimumStaff) {
    status = STAFFING_STATUS.VIABLE
  }

  return {
    status,
    slots,
    minimumStaff,
    filledSlots,
    openSlots,
    neededForMinimum
  }
}

export function getGameStaffingStatus(roles, assignments) {
  const availableRoles = Array.isArray(roles) ? roles : []
  const availableAssignments = Array.isArray(assignments) ? assignments : []
  const roleStatuses = availableRoles.map(role => getRoleStaffingStatus(
    role,
    availableAssignments.filter(assignment => assignment?.role_id === role?.id)
      .length
  ))
  const allFull = roleStatuses.length > 0
    && roleStatuses.every(result => result.status === STAFFING_STATUS.FULL)
  const allViable = roleStatuses.length > 0
    && roleStatuses.every(result => result.status !== STAFFING_STATUS.NEEDS_STAFF)

  return {
    status: allFull
      ? STAFFING_STATUS.FULL
      : allViable
        ? STAFFING_STATUS.VIABLE
        : STAFFING_STATUS.NEEDS_STAFF,
    filledSlots: roleStatuses.reduce(
      (total, result) => total + result.filledSlots,
      0
    ),
    totalSlots: roleStatuses.reduce(
      (total, result) => total + result.slots,
      0
    ),
    openSlots: roleStatuses.reduce(
      (total, result) => total + result.openSlots,
      0
    ),
    neededForMinimum: roleStatuses.reduce(
      (total, result) => total + result.neededForMinimum,
      0
    )
  }
}

export function formatRoleStaffingStatus(result) {
  const base = `${result.filledSlots}/${result.slots} besetzt`

  if (result.status === STAFFING_STATUS.FULL) {
    return base
  }

  if (result.status === STAFFING_STATUS.VIABLE) {
    return `${base} – durchführbar – ${formatOpenSlots(result.openSlots)}`
  }

  return `${base} – noch ${formatNeededStaff(result.neededForMinimum)}`
}

export function formatGameStaffingStatus(result) {
  const base = `${result.filledSlots}/${result.totalSlots} besetzt`

  if (result.status === STAFFING_STATUS.FULL) {
    return `${base} – Vollständig besetzt`
  }

  if (result.status === STAFFING_STATUS.VIABLE) {
    return `${base} – Durchführbar, ${formatOpenSlots(result.openSlots)}`
  }

  return `${base} – Helfer benötigt`
}

function formatOpenSlots(openSlots) {
  return openSlots === 1
    ? '1 Platz offen'
    : `${openSlots} Plätze offen`
}

function formatNeededStaff(neededStaff) {
  return neededStaff === 1
    ? '1 benötigt'
    : `${neededStaff} benötigt`
}

function toPositiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : 0
}

function toNonNegativeInteger(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}
