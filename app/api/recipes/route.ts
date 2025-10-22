import { prisma } from "@/lib/prisma";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: { isPublished: true },
    include: {
      author: true,
      tags: true,
      categories: true,
    },
  });

  return Response.json(recipes);
}
