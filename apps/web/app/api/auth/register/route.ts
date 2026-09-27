import { NextResponse } from 'next/server';
import { prisma } from '@life-rpg/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create User + Player
    const hashedPassword = await bcrypt.hash(String(password), 10);
    const displayName = name ? String(name).trim() : normalizedEmail.split('@')[0];

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        password: hashedPassword,
        player: {
          create: {
            level: 1,
            xp: 0,
            streakCount: 0,
          },
        },
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          player: newUser.player,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[register error]:', error);
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
