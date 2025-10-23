export default async function RecipePage({
  params,
}: {
  params: Promise<{ recipe: string }>;
}) {
  const { recipe: recipeSlug } = await params;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Recipe: {recipeSlug}</h1>
        {/* TODO: Fetch and display recipe details from database */}
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-500">Recipe details will be displayed here...</p>
          <p className="text-sm text-gray-400 mt-2">Recipe slug: {recipeSlug}</p>
        </div>
      </div>
    </div>
  );
} 