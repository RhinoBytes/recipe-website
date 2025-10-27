import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import { Clock, Flame, Users, Tag, AlertCircle, ChefHat } from "lucide-react";
import RecipeActions from "@/components/RecipeActions";
import FavoriteButton from "@/components/FavoriteButton";
import RecipeReviews from "@/components/RecipeReviews";
import SocialShare from "@/components/SocialShare";
import PrintButton from "@/components/PrintButton";

interface RecipePageProps {
  params: Promise<{ username: string; slug: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { username, slug } = await params;
  const currentUser = await getCurrentUser();

  // Find recipe by slug and verify it belongs to the specified username
  const recipe = await prisma.recipe.findFirst({
    where: { 
      slug,
      author: {
        username
      }
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
      cuisine: true,
      ingredients: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      steps: {
        orderBy: {
          stepNumber: 'asc',
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      allergens: {
        include: {
          allergen: true,
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  const isAuthor = currentUser?.userId === recipe.authorId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {recipe.title}
          </h1>
          
          {recipe.description && (
            <p className="text-lg text-gray-600 mb-6">
              {recipe.description}
            </p>
          )}

          {/* Author Info */}
          <div className="flex items-center gap-3">
            {recipe.author.avatarUrl && (
              <Image
                src={recipe.author.avatarUrl}
                alt={recipe.author.username}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {recipe.author.username}
              </div>
              <div className="text-sm text-gray-500">
                Published {new Date(recipe.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Recipe Actions (Edit/Delete) - Author Only */}
        <div className="flex gap-3 mb-6">
          <RecipeActions slug={slug} isAuthor={isAuthor} />
          <FavoriteButton recipeId={recipe.id} />
          <SocialShare 
            title={recipe.title}
            description={recipe.description || undefined}
          />
          <PrintButton />
        </div>
        
        {/* Hero Image */}
        {recipe.imageUrl && (
          <div className="mb-8">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              width={800}
              height={400}
              className="w-full h-96 object-cover rounded-2xl shadow-lg"
              priority
            />
          </div>
        )}

        {/* Metadata Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {recipe.prepTimeMinutes && (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Clock className="mx-auto mb-2 text-amber-600" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {recipe.prepTimeMinutes}
              </div>
              <div className="text-sm text-gray-600">Prep Time (min)</div>
            </div>
          )}
          
          {recipe.cookTimeMinutes && (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Flame className="mx-auto mb-2 text-orange-600" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {recipe.cookTimeMinutes}
              </div>
              <div className="text-sm text-gray-600">Cook Time (min)</div>
            </div>
          )}
          
          {recipe.servings && (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Users className="mx-auto mb-2 text-blue-600" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {recipe.servings}
              </div>
              <div className="text-sm text-gray-600">Servings</div>
            </div>
          )}
          
          {recipe.calories && (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {recipe.calories}
              </div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
          )}
          
          {recipe.difficulty && (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <ChefHat className="mx-auto mb-2 text-purple-600" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {recipe.difficulty}
              </div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
          )}
        </div>

        {/* Nutrition Info */}
        {(recipe.proteinG || recipe.fatG || recipe.carbsG) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nutrition Information</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {recipe.proteinG && (
                <div>
                  <div className="text-xl font-semibold text-gray-900">{recipe.proteinG}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
              )}
              {recipe.fatG && (
                <div>
                  <div className="text-xl font-semibold text-gray-900">{recipe.fatG}g</div>
                  <div className="text-sm text-gray-600">Fat</div>
                </div>
              )}
              {recipe.carbsG && (
                <div>
                  <div className="text-xl font-semibold text-gray-900">{recipe.carbsG}g</div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cuisine */}
        {recipe.cuisine && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Cuisine:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {recipe.cuisine.name}
              </span>
            </div>
          </div>
        )}

        {/* Source Attribution */}
        {(recipe.sourceUrl || recipe.sourceText) && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Source:</span>{' '}
              {recipe.sourceUrl ? (
                <a 
                  href={recipe.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {recipe.sourceText || recipe.sourceUrl}
                </a>
              ) : (
                <span>{recipe.sourceText}</span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                >
                  <Tag size={14} />
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {recipe.categories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.categories.map(({ category }) => (
                <span
                  key={category.id}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {recipe.allergens.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Allergen Warning</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.allergens.map(({ allergen }) => (
                      <span
                        key={allergen.id}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium"
                      >
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
          {/* Group ingredients by groupName */}
          {(() => {
            const grouped = recipe.ingredients.reduce((acc, ing) => {
              const group = ing.groupName || 'Main';
              if (!acc[group]) acc[group] = [];
              acc[group].push(ing);
              return acc;
            }, {} as Record<string, typeof recipe.ingredients>);

            return Object.entries(grouped).map(([groupName, ings]) => (
              <div key={groupName} className="mb-4 last:mb-0">
                {Object.keys(grouped).length > 1 && (
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {groupName}
                  </h3>
                )}
                <ul className="space-y-2">
                  {ings.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span className="text-gray-700">
                        {ingredient.amount && (
                          <span className="font-semibold">{ingredient.amount} </span>
                        )}
                        {ingredient.unit && (
                          <span className="font-semibold">{ingredient.unit.toLowerCase().replace(/_/g, ' ')} </span>
                        )}
                        {ingredient.name}
                        {ingredient.isOptional && (
                          <span className="text-sm text-gray-500 italic"> (optional)</span>
                        )}
                        {ingredient.notes && (
                          <span className="text-sm text-gray-600 block ml-6 mt-1">
                            {ingredient.notes}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()}
        </div>

        {/* Instructions/Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
          {recipe.steps && recipe.steps.length > 0 ? (
            <div className="space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-semibold">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">{step.instruction}</p>
                    {step.isOptional && (
                      <span className="text-sm text-gray-500 italic mt-1 block">
                        (Optional)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No instructions provided.</p>
          )}
        </div>

        {/* Reviews & Ratings */}
        <RecipeReviews 
          recipeSlug={slug} 
          isAuthor={isAuthor} 
        />
      </div>
    </div>
  );
}
