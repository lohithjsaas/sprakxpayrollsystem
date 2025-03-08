"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-lg font-bold">
            SparkX Auto Detailers
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link href="/employees" className="text-sm font-medium hover:underline">
            Employees
          </Link>
          <Link href="/attendance" className="text-sm font-medium hover:underline">
            Attendance
          </Link>
          <Link href="/payroll" className="text-sm font-medium hover:underline">
            Payroll
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </nav>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:underline py-2 border-b border-gray-100"
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link
              href="/employees"
              className="text-sm font-medium hover:underline py-2 border-b border-gray-100"
              onClick={closeMenu}
            >
              Employees
            </Link>
            <Link
              href="/attendance"
              className="text-sm font-medium hover:underline py-2 border-b border-gray-100"
              onClick={closeMenu}
            >
              Attendance
            </Link>
            <Link
              href="/payroll"
              className="text-sm font-medium hover:underline py-2 border-b border-gray-100"
              onClick={closeMenu}
            >
              Payroll
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="mt-2">
              Sign Out
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

