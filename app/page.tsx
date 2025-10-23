import {
  popularRecipes,
  recentRecipes,
  categories,
  featuredRecipe,
  spotlightChef,
} from "./data";
import RecipeCard from "@/components/ui/RecipeCard";
import CategoryCard from "@/components/ui/CategoryCard";
import FeaturedRecipe from "@/components/ui/FeaturedRecipe";
import ChefSpotlight from "@/components/ui/ChefSpotlight";
import Button from "@/components/Button";
import { Flame, Compass } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section
  className="bg-center bg-cover text-white py-24 text-center"
  style={{
    backgroundImage: `linear-gradient(
      to bottom right,
      rgba(212,115,90,0.9),
      rgba(184,92,66,0.9)
    ), url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop')`
  }}
>
  <div className="relative z-10 max-w-2xl mx-auto">
    <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow">
      Discover Amazing Recipes
    </h1>
    <p className="text-lg mb-8 opacity-95">
      Join thousands of home cooks sharing their favorite recipes and culinary
      adventures
    </p>
    <div className="flex gap-4 flex-wrap justify-center">
            <Button
              as={Link}
              href="/recipes/popular"
              variant="primary"
              size="lg"
              className="btn-large"
            >
              <Flame size={22} /> Start Cooking
            </Button>
            <Button
              as={Link}
              href="/recipes"
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
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Popular This Week
            </h2>
            <p className="text-lg text-gray-600">
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
              href="/recipes/popular"
              className="inline-flex items-center gap-2 text-[#d4735a] font-semibold hover:text-[#b85c42] transition"
            >
              View All Popular Recipes
              <span aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4735a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-[#fef9f7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Browse by Category
            </h2>
            <p className="text-lg text-gray-600">
              Find the perfect recipe for any occasion or craving
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Recently Added
            </h2>
            <p className="text-lg text-gray-600">
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
              href="/recipes/recent"
              className="inline-flex items-center gap-2 text-[#d4735a] font-semibold hover:text-[#b85c42] transition"
            >
              See All New Recipes
              <span aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4735a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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