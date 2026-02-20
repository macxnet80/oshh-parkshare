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

        // 1. Verify the calling user
        const authHeader = request.headers.get("authorization")
        if (!authHeader) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        const token = authHeader.replace("Bearer ", "")
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
        }

        // 2. Delete the user via admin API (CASCADE on profiles will clean up related data)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Delete account error:", err)
        return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
    }
}
