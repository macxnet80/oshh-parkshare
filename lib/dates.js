// Date helpers for the ParkShare app

export function formatDate(date) {
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

export function formatDateLong(date) {
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function formatDateISO(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getToday() {
  return formatDateISO(new Date())
}

export function getWeekDays(startDate) {
  const start = new Date(startDate)
  const day = start.getDay()
  const monday = new Date(start)
  monday.setDate(start.getDate() - (day === 0 ? 6 : day - 1))

  const days = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(formatDateISO(d))
  }
  return days
}

export function getNextWeeks(numWeeks = 4) {
  const weeks = []
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))

  for (let w = 0; w < numWeeks; w++) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + w * 7)
    weeks.push(getWeekDays(weekStart))
  }
  return weeks
}

export function isWeekend(dateStr) {
  const d = new Date(dateStr)
  return d.getDay() === 0 || d.getDay() === 6
}

export function isPast(dateStr) {
  return dateStr < getToday()
}

export function isToday(dateStr) {
  return dateStr === getToday()
}

export const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr"]

export function getMonthWeeks(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday of the first week containing the 1st
  const startDow = firstDay.getDay() // 0=Sun, 1=Mon ...
  const monday = new Date(firstDay)
  monday.setDate(firstDay.getDate() - (startDow === 0 ? 6 : startDow - 1))

  const weeks = []
  const current = new Date(monday)

  while (current <= lastDay || current.getDay() !== 1) {
    const week = []
    for (let i = 0; i < 5; i++) {
      // Only weekdays (Mon-Fri)
      week.push(formatDateISO(current))
      current.setDate(current.getDate() + 1)
    }
    // Skip weekend
    current.setDate(current.getDate() + 2)
    weeks.push(week)
    if (current > lastDay && current.getDay() === 1) break
  }

  return weeks
}

export function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  })
}

export function isInMonth(dateStr, year, month) {
  const d = new Date(dateStr)
  return d.getFullYear() === year && d.getMonth() === month
}
