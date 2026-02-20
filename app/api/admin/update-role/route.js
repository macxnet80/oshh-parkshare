import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
}

function getAuthClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
}

export async function POST(request) {
    try {
        const supabaseAuth = getAuthClient()
        const supabaseAdmin = getAdminClient()

        // 1. Verify the calling user is an admin
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        const token = authHeader.replace("Bearer ", "")
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token)
        if (authError || !caller) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        // Check admin role from profiles
        const { data: callerProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", caller.id)
            .single()

        if (callerProfile?.role !== "admin") {
            return NextResponse.json({ error: "Nur Admins können Rollen ändern" }, { status: 403 })
        }

        // 2. Parse request body
        const { userId, role } = await request.json()
        if (!userId || !role) {
            return NextResponse.json({ error: "Benutzer-ID und Rolle sind erforderlich" }, { status: 400 })
        }

        // 3. Update user metadata in Auth
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role }
        })

        if (authUpdateError) {
            return NextResponse.json({ error: authUpdateError.message }, { status: 400 })
        }

        // 4. Update role in public.profiles
        const { error: profileUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({ role, updated_at: new Date().toISOString() })
            .eq("id", userId)

        if (profileUpdateError) {
            return NextResponse.json({ error: profileUpdateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Update role error:", err)
        return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
    }
}
