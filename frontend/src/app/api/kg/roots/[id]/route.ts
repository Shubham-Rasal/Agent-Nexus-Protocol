import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    throw new Error('ID is required')
  }
  try {
    // Here you would typically fetch the root details from your database
    // For now, we'll return mock data
    const rootData = {
      rootId: params.id,
      rootCid: "baga6ea4seaqgezkarkz72pg3p3jcrt7p53xlky4v4rgs3wyu6nc5f2bikij4aoa",
      timestamp: new Date().toISOString(),
      status: "active"
    }

    return NextResponse.json(rootData)
  } catch (error) {
    console.error('Error fetching root details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch root details' },
      { status: 500 }
    )
  }
}
