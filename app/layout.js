import "./globals.css"

export const metadata = {
  title: "Orendt Studios | ParkShare",
  description: "Intelligentes Parkplatz-Sharing für Orendt Studios",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="font-body bg-white text-orendt-black antialiased">
        {children}
      </body>
    </html>
  )
}
