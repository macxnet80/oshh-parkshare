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

export async function DELETE(request) {
    try {
        const supabaseAuth = getAuthClient()
        const supabaseAdmin = getAdminClient()

        // 1. Verify the calling user is an admin
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        const token = authHeader.replace("Bearer ", "")
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        // 2. Verify admin role
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Nur Admins können Benutzer löschen" }, { status: 403 })
        }

        // 3. Get target user ID from request body
        const { userId } = await request.json()
        if (!userId) {
            return NextResponse.json({ error: "Benutzer-ID fehlt" }, { status: 400 })
        }

        // 4. Prevent self-deletion via this route
        if (userId === user.id) {
            return NextResponse.json({ error: "Du kannst dich nicht selbst über diese Route löschen" }, { status: 400 })
        }

        // 5. Delete the user via admin API (CASCADE on profiles will clean up related data)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Admin delete user error:", err)
        return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
    }
}
