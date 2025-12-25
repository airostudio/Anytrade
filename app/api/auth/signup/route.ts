import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, ...additionalData } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as UserRole,
        phone: additionalData.phone,
      },
    })

    // If tradesperson, create tradesperson profile
    if (role === "TRADESPERSON") {
      await prisma.tradesperson.create({
        data: {
          userId: user.id,
          trades: additionalData.trades || [],
          serviceAreas: additionalData.serviceAreas || [],
          businessName: additionalData.businessName,
          abn: additionalData.abn,
        },
      })
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      // Database connection error
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: "Database connection failed. Please check DATABASE_URL." },
          { status: 500 }
        )
      }

      // Table doesn't exist
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: "Database tables not found. Please run: npx prisma db push" },
          { status: 500 }
        )
      }

      // Prisma client not generated
      if (error.message.includes('PrismaClient')) {
        return NextResponse.json(
          { error: "Prisma client not initialized. Please run: npx prisma generate" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
