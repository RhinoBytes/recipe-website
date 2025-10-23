import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get top-level categories with recipe counts
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Top-level categories only
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: {
        recipes: {
          _count: "desc",
        },
      },
      take: 6,
    });

    // Format categories for the UI
    const formattedCategories = categories.map((category) => {
      // Convert category name to slug
      const slug = category.name.toLowerCase().replace(/\s+/g, "-");

      return {
        name: category.name,
        slug: slug,
        image: `/images/categories/${slug}.jpg`, // Assuming you have these images
      };
    });

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
