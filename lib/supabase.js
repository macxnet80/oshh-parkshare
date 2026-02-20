import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

// ─── AUTH ─────────────────────────────────────────────────────

export async function signUp(email, password, fullName, role = "flexible") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  return profile
}

// ─── PROFILES ─────────────────────────────────────────────────

export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name")
  return { data, error }
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

// ─── PARKING SPOTS ────────────────────────────────────────────

export async function getSpots() {
  const { data, error } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
  return { data, error }
}

export async function createSpot(label, zone = "Hauptparkplatz", sortOrder = 0) {
  const { data, error } = await supabase
    .from("parking_spots")
    .insert({ label, zone, sort_order: sortOrder })
    .select()
    .single()
  return { data, error }
}

export async function updateSpot(id, updates) {
  const { data, error } = await supabase
    .from("parking_spots")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  return { data, error }
}

export async function deleteSpot(id) {
  const { data, error } = await supabase
    .from("parking_spots")
    .delete()
    .eq("id", id)
  return { data, error }
}

// ─── SPOT ASSIGNMENTS ─────────────────────────────────────────

export async function getAssignments() {
  const { data, error } = await supabase
    .from("spot_assignments")
    .select(`
      *,
      spot:parking_spots(id, label, zone),
      user:profiles(id, full_name, email)
    `)
    .is("valid_until", null)
    .order("created_at", { ascending: false })
  return { data, error }
}

export async function getMyAssignment(userId) {
  const { data, error } = await supabase
    .from("spot_assignments")
    .select(`
      *,
      spot:parking_spots(id, label, zone)
    `)
    .eq("user_id", userId)
    .is("valid_until", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data, error }
}

export async function assignSpot(spotId, userId) {
  // End any existing assignment for this spot
  await supabase
    .from("spot_assignments")
    .update({ valid_until: new Date().toISOString().split("T")[0] })
    .eq("spot_id", spotId)
    .is("valid_until", null)

  const { data, error } = await supabase
    .from("spot_assignments")
    .insert({ spot_id: spotId, user_id: userId })
    .select()
    .single()
  return { data, error }
}

export async function unassignSpot(assignmentId) {
  const { data, error } = await supabase
    .from("spot_assignments")
    .update({ valid_until: new Date().toISOString().split("T")[0] })
    .eq("id", assignmentId)
    .select()
    .single()
  return { data, error }
}

// ─── AVAILABILITIES ───────────────────────────────────────────

export async function getAvailabilities(fromDate, toDate) {
  const { data, error } = await supabase
    .from("availabilities")
    .select(`
      *,
      spot:parking_spots(id, label, zone),
      released_by_user:profiles!released_by(id, full_name)
    `)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date")
  return { data, error }
}

export async function getMyAvailabilities(userId, fromDate, toDate) {
  const { data, error } = await supabase
    .from("availabilities")
    .select(`*, spot:parking_spots(id, label, zone)`)
    .eq("released_by", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date")
  return { data, error }
}

export async function releaseSpot(spotId, userId, date) {
  const { data, error } = await supabase
    .from("availabilities")
    .insert({ spot_id: spotId, released_by: userId, date })
    .select()
    .single()
  return { data, error }
}

export async function releaseSpotsMultiple(spotId, userId, dates) {
  const rows = dates.map((date) => ({
    spot_id: spotId,
    released_by: userId,
    date,
  }))
  const { data, error } = await supabase
    .from("availabilities")
    .upsert(rows, { onConflict: "spot_id,date" })
    .select()
  return { data, error }
}

export async function unreleaseSpot(availabilityId) {
  const { data, error } = await supabase
    .from("availabilities")
    .delete()
    .eq("id", availabilityId)
  return { data, error }
}

// ─── RESERVATIONS ─────────────────────────────────────────────

export async function getAvailableSpotsForDate(date) {
  // Get all availabilities for this date that haven't been reserved
  const { data, error } = await supabase
    .from("availabilities")
    .select(`
      *,
      spot:parking_spots(id, label, zone),
      released_by_user:profiles!released_by(id, full_name)
    `)
    .eq("date", date)

  if (error) return { data: null, error }

  // Get existing confirmed reservations for this date
  const { data: reservations } = await supabase
    .from("reservations")
    .select("spot_id")
    .eq("date", date)
    .eq("status", "confirmed")

  const reservedSpotIds = new Set((reservations || []).map((r) => r.spot_id))

  // Filter out already reserved spots
  const available = (data || []).filter((a) => !reservedSpotIds.has(a.spot_id))

  return { data: available, error: null }
}

export async function reserveSpot(spotId, availabilityId, userId, date) {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      spot_id: spotId,
      availability_id: availabilityId,
      user_id: userId,
      date,
    })
    .select()
    .single()
  return { data, error }
}

export async function cancelReservation(reservationId) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", reservationId)
    .select()
    .single()
  return { data, error }
}

export async function getMyReservations(userId, fromDate) {
  const { data, error } = await supabase
    .from("reservations")
    .select(`
      *,
      spot:parking_spots(id, label, zone)
    `)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", fromDate)
    .order("date")
  return { data, error }
}

export async function getReservationsForDate(date) {
  const { data, error } = await supabase
    .from("reservations")
    .select(`
      *,
      spot:parking_spots(id, label, zone),
      user:profiles(id, full_name, email)
    `)
    .eq("date", date)
    .eq("status", "confirmed")
  return { data, error }
}

// ─── DAILY OVERVIEW ───────────────────────────────────────────

export async function getDailyOverview(date) {
  // Get all active spots
  const { data: spots } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  // Get assignments
  const { data: assignments } = await supabase
    .from("spot_assignments")
    .select("*, user:profiles(id, full_name, email)")
    .lte("valid_from", date)
    .or(`valid_until.is.null,valid_until.gte.${date}`)

  // Get availabilities for this date
  const { data: availabilities } = await supabase
    .from("availabilities")
    .select("*")
    .eq("date", date)

  // Get reservations for this date
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, user:profiles(id, full_name, email)")
    .eq("date", date)
    .eq("status", "confirmed")

  const assignmentMap = {}
    ; (assignments || []).forEach((a) => { assignmentMap[a.spot_id] = a })

  const availabilityMap = {}
    ; (availabilities || []).forEach((a) => { availabilityMap[a.spot_id] = a })

  const reservationMap = {}
    ; (reservations || []).forEach((r) => { reservationMap[r.spot_id] = r })

  const overview = (spots || []).map((spot) => {
    const assignment = assignmentMap[spot.id]
    const availability = availabilityMap[spot.id]
    const reservation = reservationMap[spot.id]

    let status = "unassigned"
    let owner = null
    let reservedBy = null

    if (assignment) {
      owner = assignment.user
      if (availability) {
        if (reservation) {
          status = "reserved"
          reservedBy = reservation.user
        } else {
          status = "available"
        }
      } else {
        status = "occupied"
      }
    }

    return {
      ...spot,
      status,
      owner,
      reservedBy,
      availability,
      reservation,
    }
  })

  return { data: overview, error: null }
}

// ─── STATS ────────────────────────────────────────────────────

export async function getStats() {
  const today = new Date().toISOString().split("T")[0]

  const [
    { count: totalSpots },
    { count: totalUsers },
    { data: todayReservations },
    { data: todayAvailabilities },
  ] = await Promise.all([
    supabase.from("parking_spots").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*").eq("date", today).eq("status", "confirmed"),
    supabase.from("availabilities").select("*").eq("date", today),
  ])

  return {
    totalSpots: totalSpots || 0,
    totalUsers: totalUsers || 0,
    todayReservations: todayReservations?.length || 0,
    todayAvailable: todayAvailabilities?.length || 0,
  }
}

// ─── APP SETTINGS ─────────────────────────────────────────────

export async function getAppSetting(key) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single()
  return { data: data?.value ?? null, error }
}

export async function updateAppSetting(key, value) {
  const { data, error } = await supabase
    .from("app_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single()
  return { data, error }
}

// ─── PASSWORD MANAGEMENT ──────────────────────────────────────

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  return { data, error }
}

// ─── EMAIL MANAGEMENT ─────────────────────────────────────────

export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail })
  return { data, error }
}

export async function markPasswordChanged(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()
  return { data, error }
}

export async function createUserViaAdmin(email, fullName, role, token) {
  const res = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, fullName, role }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Fehler beim Anlegen")
  return data
}

export function getSession() {
  return supabase.auth.getSession()
}

// Toggle is_blocked on a user profile
export async function toggleBlockUser(userId, blocked) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_blocked: blocked, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()
  return { data, error }
}

// Admin deletes another user (calls the admin API route)
export async function deleteUserByAdmin(userId, token) {
  const res = await fetch("/api/admin/delete-user", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Fehler beim Löschen")
  return data
}
