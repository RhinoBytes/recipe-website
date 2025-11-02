
import Image from "next/image";
import RecipeCard from "@/components/ui/RecipeCard";
import CategoryCard from "@/components/ui/CategoryCard";
import FeaturedRecipe from "@/components/ui/FeaturedRecipe";
import ChefSpotlight from "@/components/ui/ChefSpotlight";
import Button from '@/components/ui/Button';
import { Flame, Compass } from "lucide-react";
import Link from "next/link";
import { getPopularRecipes, getRecentRecipes, getFeaturedRecipe } from "@/lib/queries/recipes";
import { getSpotlightChef } from "@/lib/queries/users";

// Make this page dynamic since it fetches from database
export const dynamic = 'force-dynamic';

const CATEGORIES = [
  {
    name: "Breakfast",
    slug: "breakfast",
    image: "/img/categories/Breakfast.jpg",
  },
  {
    name: "Lunch",
    slug: "lunch",
    image: "/img/categories/Lunch.jpg",
  },
  {
    name: "Dinner",
    slug: "dinner",
    image: "/img/categories/Dinner.jpg",
  },
  {
    name: "Dessert",
    slug: "dessert",
    image: "/img/categories/Dessert.jpg",
  },
  {
    name: "Snack",
    slug: "snack",
    image: "/img/categories/Snack.jpg",
  },
  {
    name: "Salad",
    slug: "salad",
    image: "/img/categories/Salad.jpg",
  },
];

export default async function HomePage() {
  const [popularRecipes, recentRecipes, featuredRecipe, spotlightChef] = await Promise.all([
    getPopularRecipes(),
    getRecentRecipes(),
    getFeaturedRecipe(),
    getSpotlightChef(),
  ]);

  return (
    <main   >

{/* Hero Section */}
<section className="relative text-center text-bg min-h-[500px] flex items-center ">
  <div className="h-20 flex-shrink-0" /> 
  {/* Background image + gradient overlay */}
  <div className="absolute inset-0 w-full h-full bg-center bg-cover">
    <Image
      src="/img/hero/Hero.jpeg"
      alt="Hero Background"
      fill
      className="object-cover"
      priority
      sizes="100vw"
    />
    {/* Theme-aware gradient overlay */}
    <div
      className="absolute inset-0"
      style={{ backgroundImage: 'var(--card-gradient)' }}
    />
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-2xl mx-auto px-4">
    <h1 className="text-4xl sm:text-5xl font-bold font-heading mb-4 drop-shadow">
      Discover Amazing Recipes
    </h1>
    <p className="text-lg mb-8 opacity-95">
      Join thousands of home cooks sharing their favorite recipes and culinary adventures
    </p>
    <div className="flex gap-4 flex-wrap justify-center">
      <Button
        as="link"
        href="/browse?sort=popular"
        variant="primary"
        size="lg"
        className="btn-large"
      >
        <Flame size={22} /> Start Cooking
      </Button>
      <Button
        as="link"
        href="/browse"
        variant="primary"
        size="lg"
        className="btn-large"
      >
        <Compass size={22} /> Browse Recipes
      </Button>
    </div>
  </div>
</section>

      {/* Popular Recipes */}
      <section className="py-16 bg-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading mb-2 text-text">
              Popular This Week
            </h2>
            <p className="text-lg text-text-secondary">
              The most loved recipes by our community of home cooks
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
            {popularRecipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} priority={index < 3} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-hover transition"
            >
              View All Popular Recipes
              <span aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-accent-light/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading mb-2 text-text">
              Browse by Category
            </h2>
            <p className="text-lg text-text-secondary">
              Find the perfect recipe for any occasion or craving
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="py-16 bg-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading mb-2 text-text">
              Recently Added
            </h2>
            <p className="text-lg text-text-secondary">
              Fresh recipes from our community of passionate cooks
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
            {recentRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-hover transition"
            >
              See All New Recipes
              <span aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipe */}
      <FeaturedRecipe featured={featuredRecipe} />

      {/* Chef Spotlight */}
      <ChefSpotlight chef={spotlightChef} />
    </main>
  );
}