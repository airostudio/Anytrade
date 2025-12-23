import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'TRADESPERSON') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!session.user.tradespersonId) {
      return NextResponse.json(
        { error: "Tradesperson profile not found" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { jobId, proposal, quotedPrice, estimatedDays } = body

    // Validate required fields
    if (!jobId || !proposal || !quotedPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      )
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_tradespersonId: {
          jobId,
          tradespersonId: session.user.tradespersonId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        tradespersonId: session.user.tradespersonId,
        userId: session.user.id,
        proposal,
        quotedPrice: parseFloat(quotedPrice),
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Application creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role === 'TRADESPERSON') {
      if (!session.user.tradespersonId) {
        return NextResponse.json(
          { error: "Tradesperson profile not found" },
          { status: 400 }
        )
      }

      const applications = await prisma.jobApplication.findMany({
        where: {
          tradespersonId: session.user.tradespersonId,
        },
        include: {
          job: {
            include: {
              client: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ applications })
    }

    if (session.user.role === 'CLIENT') {
      const { searchParams } = new URL(request.url)
      const jobId = searchParams.get('jobId')

      if (!jobId) {
        return NextResponse.json(
          { error: "Job ID required" },
          { status: 400 }
        )
      }

      // Verify the job belongs to the client
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      })

      if (!job || job.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }

      const applications = await prisma.jobApplication.findMany({
        where: {
          jobId,
        },
        include: {
          tradesperson: {
            select: {
              businessName: true,
              trades: true,
              averageRating: true,
              totalReviews: true,
              completedJobs: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ applications })
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  } catch (error) {
    console.error("Applications fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
