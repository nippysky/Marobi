import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing slide id in URL' },
      { status: 400 }
    )
  }

  try {
    await prisma.heroSlide.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to delete hero slide', err)
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: `Slide with id "${id}" not found` },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error deleting slide' },
      { status: 500 }
    )
  }
}
