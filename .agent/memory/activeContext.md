# Active Context: Parkshare

## Current Focus
Datetime-Handling auf lokale Zeitzone umgestellt, damit der heutige Tag korrekt als buchbar erkannt wird.

## Recent Changes
- [x] `lib/dates.js`: `formatDateISO()` von UTC (`toISOString`) auf lokale Zeitzone umgestellt
- [x] `lib/supabase.js`: Alle `toISOString().split('T')[0]` durch `getToday()` ersetzt
- [x] `components/ParkingOverview.jsx`: `changeDate()` nutzt jetzt `formatDateISO()`

## Next Steps
- [ ] Testen: OwnerCalendar → heutiger Tag klickbar und freigebebar
- [ ] Testen: FlexibleBooking → freigegebener Platz heute buchbar
