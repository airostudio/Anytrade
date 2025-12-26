import { NextResponse } from "next/server"

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL

    return NextResponse.json({
      hasDatabaseUrl: !!databaseUrl,
      startsWithPostgresql: databaseUrl?.startsWith('postgresql://') || databaseUrl?.startsWith('postgres://'),
      urlLength: databaseUrl?.length || 0,
      firstChars: databaseUrl?.substring(0, 15) || 'NOT SET',
      allEnvVars: Object.keys(process.env).filter(key =>
        key.includes('DATABASE') || key.includes('NEXT') || key.includes('VERCEL')
      ),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
