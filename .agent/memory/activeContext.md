# Active Context: Parkshare

## Current Focus
User Profile/Settings Page für alle Rollen implementiert.

## Recent Changes
- [x] `lib/supabase.js`: `updateEmail()` Funktion hinzugefügt
- [x] API-Route `/api/user/delete-account` (Service Role Key, JWT-Verification)
- [x] `components/UserSettings.jsx`: Name/E-Mail/Passwort ändern + Account löschen (Danger Zone mit Bestätigungs-Modal)
- [x] `app/profile/page.js`: Neue Profilseite mit Auth-Guard
- [x] `components/Header.jsx`: "Profil" NavTab für alle User-Rollen

## Next Steps
- [ ] End-to-End Test: Name ändern → Header zeigt neuen Namen
- [ ] End-to-End Test: Passwort ändern → Neu einloggen mit neuem PW
- [ ] End-to-End Test: Account löschen → Redirect auf Login, User aus DB entfernt
