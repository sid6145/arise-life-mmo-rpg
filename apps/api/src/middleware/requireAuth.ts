import { Request, Response, NextFunction } from 'express';
import { prisma } from '@life-rpg/db';
import { decode } from '@auth/core/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const rawSessionToken =
      req.cookies?.['authjs.session-token'] ||
      req.cookies?.['__Secure-authjs.session-token'] ||
      req.cookies?.['next-auth.session-token'] ||
      req.cookies?.['__Secure-next-auth.session-token'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!rawSessionToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No session token provided in cookies or header',
      });
    }

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

    // 1. Try decoding as Auth.js JWT session token
    if (secret) {
      try {
        const decoded = await decode({
          token: rawSessionToken,
          secret,
          salt: req.cookies?.['__Secure-authjs.session-token'] || req.cookies?.['__Secure-next-auth.session-token']
            ? '__Secure-authjs.session-token'
            : 'authjs.session-token',
        });

        if (decoded?.id || decoded?.sub) {
          const userId = (decoded.id || decoded.sub) as string;
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            req.userId = user.id;
            return next();
          }
        }
      } catch (jwtErr) {
        // Fall through to database session check
      }
    }

    // 2. Check if database session exists (for database session strategy)
    const session = await prisma.session.findUnique({
      where: { sessionToken: rawSessionToken },
    });

    if (session) {
      if (new Date(session.expires) < new Date()) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Session token has expired',
        });
      }
      req.userId = session.userId;
      return next();
    }

    // 3. Check if token is a direct user ID (for development/testing)
    const user = await prisma.user.findUnique({
      where: { id: rawSessionToken },
    });

    if (user) {
      req.userId = user.id;
      return next();
    }

    // If none matched, return 401
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session token',
    });
  } catch (error) {
    console.error('[requireAuth] Error verifying session token:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify session',
    });
  }
}
