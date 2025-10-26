// api/categories/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// It's best practice to instantiate Prisma Client outside the handler
// to reuse the connection across function invocations.
const prisma = new PrismaClient();

// Define the shape of your JWT payload
interface JwtPayload {
  userId: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // --- 1. Handle HTTP Method ---
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // --- 2. Authentication (This replaces @UseGuards(JwtAuthGuard)) ---
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid.' });
    }
    const token = authHeader.split(' ')[1];

    // Verify the token and extract the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    // --- 3. Business Logic (This is from your CategoriesService) ---
    const categories = await prisma.category.findMany({
      where: { userId: userId },
      orderBy: { name: 'asc' },
    });

    // --- 4. Send Response ---
    return res.status(200).json(categories);

  } catch (error: any) {
    // Handle specific errors like invalid JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
    }
    // Generic server error
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}