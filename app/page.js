"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login")
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
      <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
    </div>
  )
}
