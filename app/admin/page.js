"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks"
import Header from "@/components/Header"
import AdminPanel from "@/components/AdminPanel"
import Footer from "@/components/Footer"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login")
      } else if (user.role !== "admin") {
        router.replace("/dashboard")
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orendt-gray-50">
        <div className="w-8 h-8 border-2 border-orendt-gray-200 border-t-orendt-black rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orendt-gray-50">
      <Header user={user} currentPage="admin" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AdminPanel user={user} />
      </main>
      <Footer />
    </div>
  )
}
