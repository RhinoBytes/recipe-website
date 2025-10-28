import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import { Clock, Flame, Users, Tag, AlertCircle, ChefHat, ListOrdered } from "lucide-react";
import RecipeActions from "@/components/RecipeActions";
import RecipeReviews from "@/components/RecipeReviews";
import IngredientsList from "@/components/recipe/IngredientsList";
import RecipeSidebar from "@/components/recipe/RecipeSidebar";
import ChefNotes from "@/components/recipe/ChefNotes";
import RelatedRecipes from "@/components/recipe/RelatedRecipes";

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

  // Fetch related recipes (same categories or tags, excluding current recipe)
  const relatedRecipes = await prisma.recipe.findMany({
    where: {
      id: { not: recipe.id },
      status: 'PUBLISHED',
      OR: [
        {
          categories: {
            some: {
              categoryId: {
                in: recipe.categories.map((c) => c.category.id),
              },
            },
          },
        },
        {
          tags: {
            some: {
              tagId: {
                in: recipe.tags.map((t) => t.tag.id),
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      difficulty: true,
      averageRating: true,
      author: {
        select: {
          username: true,
        },
      },
    },
    take: 3,
    orderBy: {
      averageRating: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-accent-light to-secondary-light py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            {recipe.title}
          </h1>
          
          {recipe.description && (
            <p className="text-lg text-text-secondary mb-6 max-w-3xl">
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
              <div className="font-semibold text-text">
                {recipe.author.username}
              </div>
              <div className="text-sm text-text-muted">
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

      {/* Main Container with Two-Column Layout */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content Column */}
          <div className="space-y-8">
            {/* Recipe Actions (Edit/Delete) - Author Only */}
            {isAuthor && (
              <div className="print:hidden">
                <RecipeActions slug={slug} isAuthor={isAuthor} />
              </div>
            )}
            
            {/* Hero Image */}
            {recipe.imageUrl && (
              <div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recipe.prepTimeMinutes && (
                <div className="bg-bg-secondary rounded-lg shadow-md p-4 text-center">
                  <Clock className="mx-auto mb-2 text-accent" size={24} />
                  <div className="text-2xl font-bold text-text">
                    {recipe.prepTimeMinutes}
                  </div>
                  <div className="text-sm text-text-secondary">Prep Time (min)</div>
                </div>
              )}
              
              {recipe.cookTimeMinutes && (
                <div className="bg-bg-secondary rounded-lg shadow-md p-4 text-center">
                  <Flame className="mx-auto mb-2 text-accent" size={24} />
                  <div className="text-2xl font-bold text-text">
                    {recipe.cookTimeMinutes}
                  </div>
                  <div className="text-sm text-text-secondary">Cook Time (min)</div>
                </div>
              )}
              
              {recipe.servings && (
                <div className="bg-bg-secondary rounded-lg shadow-md p-4 text-center">
                  <Users className="mx-auto mb-2 text-secondary" size={24} />
                  <div className="text-2xl font-bold text-text">
                    {recipe.servings}
                  </div>
                  <div className="text-sm text-text-secondary">Servings</div>
                </div>
              )}
              
              {recipe.difficulty && (
                <div className="bg-bg-secondary rounded-lg shadow-md p-4 text-center">
                  <ChefHat className="mx-auto mb-2 text-muted" size={24} />
                  <div className="text-2xl font-bold text-text capitalize">
                    {recipe.difficulty.toLowerCase()}
                  </div>
                  <div className="text-sm text-text-secondary">Difficulty</div>
                </div>
              )}
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
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
            )}

            {/* Categories */}
            {recipe.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Categories</h3>
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
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Allergen Warning</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipe.allergens.map(({ allergen }) => (
                        <span
                          key={allergen.id}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                        >
                          {allergen.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients with Interactive List */}
            <IngredientsList ingredients={recipe.ingredients} />

            {/* Instructions/Steps */}
            <div className="bg-bg-secondary rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ListOrdered className="text-amber-600" size={28} />
                Instructions
              </h2>
              {recipe.steps && recipe.steps.length > 0 ? (
                <div>
                  {/* Group steps by groupName */}
                  {(() => {
                    const grouped = recipe.steps.reduce((acc, step) => {
                      const group = step.groupName || 'Main';
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(step);
                      return acc;
                    }, {} as Record<string, typeof recipe.steps>);

                    return Object.entries(grouped).map(([groupName, steps]) => (
                      <div key={groupName} className="mb-6 last:mb-0">
                        {Object.keys(grouped).length > 1 && (
                          <h3 className="text-lg font-semibold text-text mb-3">
                            {groupName}
                          </h3>
                        )}
                        <div className="space-y-4">
                          {steps.map((step) => (
                            <div key={step.id} className="flex gap-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                {step.stepNumber}
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="text-text leading-relaxed">{step.instruction}</p>
                                {step.isOptional && (
                                  <span className="text-sm text-text-muted italic mt-1 block">
                                    (Optional step)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-text-muted">No instructions provided.</p>
              )}
            </div>

            {/* Chef Notes */}
            <ChefNotes notes={recipe.sourceText} />

            {/* Cuisine & Source */}
            {(recipe.cuisine || recipe.sourceUrl) && (
              <div className="bg-bg-secondary rounded-lg shadow-md p-4 text-sm">
                {recipe.cuisine && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-text">Cuisine:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">
                      {recipe.cuisine.name}
                    </span>
                  </div>
                )}
                {recipe.sourceUrl && (
                  <div className="text-text">
                    <span className="font-semibold">Source:</span>{' '}
                    <a 
                      href={recipe.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700 underline"
                    >
                      {recipe.sourceText || recipe.sourceUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Reviews & Ratings */}
            <RecipeReviews 
              recipeSlug={slug} 
              isAuthor={isAuthor} 
            />

            {/* Related Recipes */}
            <RelatedRecipes 
              recipes={relatedRecipes.map((r) => ({
                ...r,
                averageRating: r.averageRating ? parseFloat(r.averageRating.toString()) : 0,
              }))} 
            />
          </div>

          {/* Sidebar Column (Desktop) */}
          <div className="lg:sticky lg:top-8 lg:self-start print:hidden">
            <RecipeSidebar
              recipeId={recipe.id}
              title={recipe.title}
              description={recipe.description || undefined}
              averageRating={recipe.averageRating ? parseFloat(recipe.averageRating.toString()) : 0}
              reviewCount={recipe.reviewCount}
              calories={recipe.calories}
              proteinG={recipe.proteinG}
              fatG={recipe.fatG}
              carbsG={recipe.carbsG}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
