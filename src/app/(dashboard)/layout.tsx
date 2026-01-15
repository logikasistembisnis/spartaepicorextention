import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import DashboardWrapper from '@/components/DashboardWrapper'
import { SidebarProvider } from '@/context/SidebarContext'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cek Login & Ambil UserID dari Server
  const cookieStore = await cookies()
  const authSession = cookieStore.get('session_auth')?.value

  if (!authSession) {
    redirect('/login')
  }

  // Decode UserID
  let username = 'User'
  try {
    const base64Credentials = authSession.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    username = credentials.split(':')[0]
  } catch (e) {
    console.error("Gagal decode username", e)
  }

  return (
    // Bungkus semua dengan Provider agar Sidebar & Header nyambung
    <SidebarProvider>
        <div className="min-h-screen bg-gray-50">
            
            {/* Sidebar (Props userId tetap dari server) */}
            <Sidebar userId={username} />

            {/* Header */}
            <Header />

            {/* Body Content (Wrapper Client untuk animasi margin) */}
            <DashboardWrapper>
                {children}
            </DashboardWrapper>
            
        </div>
    </SidebarProvider>
  )
}