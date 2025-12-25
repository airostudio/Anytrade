import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()

    // Check if tables exist by attempting a simple query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: "healthy",
      message: "Database connection successful",
      tablesExist: true,
      userCount,
    })
  } catch (error) {
    console.error("Database health check failed:", error)

    let errorMessage = "Unknown error"
    let suggestion = "Check your database configuration"

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        suggestion = "Database connection failed. Verify your DATABASE_URL in environment variables."
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        suggestion = "Database tables don't exist. Run 'npx prisma db push' to create them."
      } else if (error.message.includes('PrismaClient')) {
        suggestion = "Prisma client not generated. Run 'npx prisma generate'."
      }
    }

    return NextResponse.json(
      {
        status: "unhealthy",
        error: errorMessage,
        suggestion,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
