import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      budget,
      address,
      city,
      state,
      postcode,
      preferredDate,
      urgency,
    } = body

    // Validate required fields
    if (!title || !description || !category || !budget || !address || !city || !state || !postcode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        clientId: session.user.id,
        title,
        description,
        category,
        budget: parseFloat(budget),
        address,
        city,
        state,
        postcode,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        urgency,
        status: 'OPEN',
      },
    })

    return NextResponse.json(
      {
        message: "Job posted successfully",
        job: {
          id: job.id,
          title: job.title,
          status: job.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const postcode = searchParams.get('postcode')
    const status = searchParams.get('status')

    let where: any = {}

    if (category) {
      where.category = category
    }

    if (postcode) {
      where.postcode = postcode
    }

    if (status) {
      where.status = status
    } else {
      where.status = 'OPEN' // Default to open jobs
    }

    // If tradesperson, only show open jobs they haven't applied to
    if (session?.user.role === 'TRADESPERSON') {
      const jobs = await prisma.job.findMany({
        where,
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          applications: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ jobs })
    }

    // If client, show only their jobs
    if (session?.user.role === 'CLIENT') {
      where.clientId = session.user.id

      const jobs = await prisma.job.findMany({
        where,
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ jobs })
    }

    // If not authenticated, return public jobs (for browsing)
    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        budget: true,
        city: true,
        state: true,
        postcode: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Job fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
