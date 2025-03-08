import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@/utils/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export async function generateEmployeeId(): Promise<string> {
  const supabase = createClient()

  try {
    // Get the highest current employee_id
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id")
      .not("employee_id", "is", null)
      .order("employee_id", { ascending: false })
      .limit(1)

    if (error) throw error

    let nextId = 1
    if (data && data.length > 0 && data[0].employee_id) {
      // Extract the number from SPXxxx format
      const match = data[0].employee_id.match(/SPX(\d+)/)
      if (match && match[1]) {
        nextId = Number.parseInt(match[1], 10) + 1
      }
    }

    // Format with leading zeros (SPX001, SPX002, etc.)
    return `SPX${nextId.toString().padStart(3, "0")}`
  } catch (err) {
    console.error("Error generating employee ID:", err)
    return ""
  }
}

