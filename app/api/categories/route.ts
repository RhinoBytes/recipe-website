import { NextResponse } from "next/server";
import { getCategories } from "@/lib/queries/metadata";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    
    // Validate limit parameter
    let limit: number | undefined;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        limit = parsed;
      }
    }
    
    // Get categories using reusable function
    const categories = await getCategories();
    
    // Apply limit if specified and valid
    const limitedCategories = limit 
      ? categories.slice(0, limit)
      : categories;
    
    // Format categories for the UI
    const formattedCategories = limitedCategories.map((category) => {
      const slug = category.name.toLowerCase().replace(/\s+/g, "-");

      return {
        id: category.id,
        name: category.name,
        slug: slug,
        count: category._count.recipes,
        image: `/images/categories/${slug}.jpg`,
      };
    });

    log.info({ count: formattedCategories.length, limit }, "Fetched categories successfully");

    return NextResponse.json(formattedCategories);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Failed to fetch categories"
    );
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
