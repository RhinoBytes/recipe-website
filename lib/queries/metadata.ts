import { prisma } from "@/lib/prisma";

/**
 * Get all categories
 */
export async function getCategories() {
  return prisma.category.findMany({
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
      name: "asc",
    },
  });
}

/**
 * Get all tags with recipe counts
 */
export async function getTags() {
  return prisma.tag.findMany({
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
      name: "asc",
    },
  });
}

/**
 * Get all cuisines
 */
export async function getCuisines() {
  return prisma.cuisine.findMany({
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
      name: "asc",
    },
  });
}

/**
 * Get all allergens
 */
export async function getAllergens() {
  return prisma.allergen.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Format metadata for client use
 */
export function formatMetadata(items: { id: string; name: string; _count?: { recipes: number } }[]) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    count: item._count?.recipes || 0,
  }));
}
