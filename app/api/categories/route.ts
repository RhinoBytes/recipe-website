import { NextResponse } from "next/server";
import { getCategories } from "@/lib/queries/metadata";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    
    // Get categories using reusable function
    const categories = await getCategories();
    
    // Apply limit if specified
    const limitedCategories = limit 
      ? categories.slice(0, parseInt(limit))
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

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
