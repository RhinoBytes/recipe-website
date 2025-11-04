import { PrismaClient } from "@prisma/client";

/**
 * Recursively finds all descendant category IDs for a given parent category
 * 
 * NOTE: This implementation makes N+1 database queries for deep hierarchies.
 * For production use with deep category trees, consider optimizing with:
 * - Recursive Common Table Expression (CTE) in a single query
 * - Materialized path model (storing full path as string)
 * - Nested set model (storing left/right boundaries)
 * - Caching the category hierarchy in memory/Redis
 * 
 * @param parentId - The ID of the parent category
 * @param prisma - The Prisma client instance
 * @returns Array of all descendant category IDs including the parent ID
 */
export async function getDescendantCategoryIds(
  parentId: string,
  prisma: PrismaClient
): Promise<string[]> {
  const categoryIds: string[] = [parentId];

  // Find all direct children of the parent
  const children = await prisma.category.findMany({
    where: { parentId },
    select: { id: true },
  });

  // Recursively get descendants for each child
  for (const child of children) {
    const childDescendants = await getDescendantCategoryIds(child.id, prisma);
    categoryIds.push(...childDescendants);
  }

  return categoryIds;
}

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

/**
 * Transforms a flat list of categories into a nested tree structure
 * @param categories - Flat list of categories from Prisma
 * @returns Array of top-level category nodes with nested children
 */
export function buildCategoryTree(
  categories: Array<{ id: string; name: string; parentId: string | null }>
): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  const rootCategories: CategoryNode[] = [];

  // First pass: create all category nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      children: [],
    });
  });

  // Second pass: build the tree structure
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (!node) return;

    if (cat.parentId === null) {
      // This is a root category
      rootCategories.push(node);
    } else {
      // This is a child category, add it to its parent
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
  });

  return rootCategories;
}
