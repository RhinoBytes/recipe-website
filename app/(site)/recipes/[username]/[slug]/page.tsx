import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import { Clock, Flame, Users, Tag, AlertCircle, ChefHat, ListOrdered, Star } from "lucide-react";
import RecipeActions from '@/components/recipe/RecipeActions';
import RecipeReviews from '@/components/recipe/RecipeReviews';
import IngredientsList from "@/components/recipe/IngredientsList";
import RecipeSidebar from "@/components/recipe/RecipeSidebar";
import ChefNotes from "@/components/recipe/ChefNotes";
import RelatedRecipes from "@/components/recipe/RelatedRecipes";
import FavoriteButton from '@/components/recipe/FavoriteButton';
import SocialShare from '@/components/recipe/SocialShare';
import PrintButton from '@/components/recipe/PrintButton';
import AccordionSection from '@/components/ui/AccordionSection';
import { DEFAULT_RECIPE_IMAGE, DEFAULT_USER_AVATAR } from "@/lib/constants";

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
      media: {
        select: {
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
      author: {
        select: {
          id: true,
          username: true,
          bio: true,
          media: {
            where: { isProfileAvatar: true },
            select: {
              url: true,
              secureUrl: true,
            },
            take: 1,
          },
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

  // Extract media URLs
  const primaryMedia = recipe.media.find(m => m.isPrimary) || recipe.media[0];
  const recipeImageUrl = primaryMedia?.secureUrl || primaryMedia?.url || DEFAULT_RECIPE_IMAGE;

  const avatarMedia = recipe.author.media[0];
  const authorAvatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

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
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      difficulty: true,
      averageRating: true,
      media: {
        select: {
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
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
      {/* Hero Section - Fixed Height */}
      <div className="bg-gradient-to-br from-accent-light to-secondary-light py-12 min-h-[280px] flex items-center">
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
            <Image
              src={authorAvatarUrl}
              alt={recipe.author.username}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
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
            <div>
              <Image
                src={recipeImageUrl}
                alt={recipe.title}
                width={800}
                height={400}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
                priority
              />
            </div>

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

            {/* Mobile-Only Accordion Sections for Quick Actions & Nutrition */}
            {/*
              Extract averageRatingFloat to avoid duplicate parseFloat logic
            */}
            {(() => {
              const averageRatingFloat =
                recipe.averageRating && !isNaN(Number(recipe.averageRating))
                  ? parseFloat(recipe.averageRating.toString())
                  : 0;
              return (
                <div className="lg:hidden bg-bg-secondary rounded-lg shadow-md overflow-hidden">
                  <AccordionSection title="Quick Actions" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FavoriteButton recipeId={recipe.id} />
                      </div>
                      <SocialShare title={recipe.title} description={recipe.description || undefined} />
                      <PrintButton />
                    </div>
                  </AccordionSection>

                  {(recipe.averageRating && recipe.averageRating > 0) || recipe.reviewCount > 0 ? (
                    <AccordionSection title="Rating" defaultOpen={false}>
                      <div className="text-center space-y-3">
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={24}
                              className={
                                star <= Math.round(averageRatingFloat)
                                  ? "fill-highlight text-highlight"
                                  : "text-border"
                              }
                            />
                          ))}
                        </div>
                        <div className="text-3xl font-bold text-text">
                          {averageRatingFloat.toFixed(1)}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {recipe.reviewCount} {recipe.reviewCount === 1 ? "review" : "reviews"}
                        </div>
                      </div>
                    </AccordionSection>
                  ) : null}

                  <AccordionSection title="Nutrition Per Serving" defaultOpen={false}>
                    {(recipe.calories || recipe.proteinG || recipe.fatG || recipe.carbsG) ? (
                      <div className="grid grid-cols-2 gap-3">
                        {recipe.calories && (
                          <div className="bg-bg rounded-lg p-4 text-center border-2 border-accent/20">
                            <div className="text-3xl font-bold text-accent">{recipe.calories}</div>
                            <div className="text-xs text-text-secondary mt-1 font-medium">Calories</div>
                          </div>
                        )}
                        {recipe.proteinG && (
                          <div className="bg-bg rounded-lg p-4 text-center border-2 border-secondary/20">
                            <div className="text-3xl font-bold text-secondary">{recipe.proteinG}g</div>
                            <div className="text-xs text-text-secondary mt-1 font-medium">Protein</div>
                          </div>
                        )}
                        {recipe.fatG && (
                          <div className="bg-bg rounded-lg p-4 text-center border-2 border-muted/20">
                            <div className="text-3xl font-bold text-muted">{recipe.fatG}g</div>
                            <div className="text-xs text-text-secondary mt-1 font-medium">Fat</div>
                          </div>
                        )}
                        {recipe.carbsG && (
                          <div className="bg-bg rounded-lg p-4 text-center border-2 border-highlight/20">
                            <div className="text-3xl font-bold text-highlight">{recipe.carbsG}g</div>
                            <div className="text-xs text-text-secondary mt-1 font-medium">Carbs</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-text-secondary">Not Available</p>
                        <p className="text-xs text-text-muted mt-1">
                          Nutritional data has not been provided for this recipe
                        </p>
                      </div>
                    )}
                  </AccordionSection>
                </div>
              );
            })()}
              <AccordionSection title="Nutrition Per Serving" defaultOpen={false}>
                {(recipe.calories || recipe.proteinG || recipe.fatG || recipe.carbsG) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {recipe.calories && (
                      <div className="bg-bg rounded-lg p-4 text-center border-2 border-accent/20">
                        <div className="text-3xl font-bold text-accent">{recipe.calories}</div>
                        <div className="text-xs text-text-secondary mt-1 font-medium">Calories</div>
                      </div>
                    )}
                    {recipe.proteinG && (
                      <div className="bg-bg rounded-lg p-4 text-center border-2 border-secondary/20">
                        <div className="text-3xl font-bold text-secondary">{recipe.proteinG}g</div>
                        <div className="text-xs text-text-secondary mt-1 font-medium">Protein</div>
                      </div>
                    )}
                    {recipe.fatG && (
                      <div className="bg-bg rounded-lg p-4 text-center border-2 border-muted/20">
                        <div className="text-3xl font-bold text-muted">{recipe.fatG}g</div>
                        <div className="text-xs text-text-secondary mt-1 font-medium">Fat</div>
                      </div>
                    )}
                    {recipe.carbsG && (
                      <div className="bg-bg rounded-lg p-4 text-center border-2 border-highlight/20">
                        <div className="text-3xl font-bold text-highlight">{recipe.carbsG}g</div>
                        <div className="text-xs text-text-secondary mt-1 font-medium">Carbs</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-text-secondary">Not Available</p>
                    <p className="text-xs text-text-muted mt-1">
                      Nutritional data has not been provided for this recipe
                    </p>
                  </div>
                )}
              </AccordionSection>
            </div>

            {/* Ingredients with Interactive List */}
            <IngredientsList ingredients={recipe.ingredients} />

            {/* Instructions/Steps */}
            <div className="bg-bg-secondary rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <ListOrdered className="text-accent" size={28} />
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
                        <ol className="space-y-4 list-none" role="list">
                          {steps.map((step) => (
                            <li key={step.id} className="flex gap-4">
                              <div 
                                className="flex-shrink-0 w-10 h-10 bg-accent text-bg rounded-full flex items-center justify-center font-bold text-lg"
                                aria-label={`Step ${step.stepNumber}`}
                              >
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
                            </li>
                          ))}
                        </ol>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-text-muted">No instructions provided.</p>
              )}
            </div>

            {/* Chef Notes */}
            <ChefNotes notes={recipe.chefNotes} />

            {/* Cuisine & Source */}
            {(recipe.cuisine || recipe.sourceUrl || recipe.sourceText) && (
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
                      {recipe.sourceUrl}
                    </a>
                  </div>
                )}
                {!recipe.sourceUrl && recipe.sourceText && (
                  <div className="text-text">
                    <span className="font-semibold">Source:</span>{' '}
                    <span className="text-text-secondary">{recipe.sourceText}</span>
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
