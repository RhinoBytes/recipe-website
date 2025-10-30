import { prisma } from "@/lib/prisma";
import Image from "next/image";
import RecipeCard from "@/components/ui/RecipeCard";
import CategoryCard from "@/components/ui/CategoryCard";
import FeaturedRecipe from "@/components/ui/FeaturedRecipe";
import ChefSpotlight from "@/components/ui/ChefSpotlight";
import Button from '@/components/ui/Button';
import { Flame, Compass } from "lucide-react";
import Link from "next/link";
import { getCategoryImage } from "@/lib/placeholders";
// Make this page dynamic since it fetches from database
export const dynamic = 'force-dynamic';

async function getPopularRecipes() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const popularRecipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      author: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          favorites: {
            where: {
              createdAt: {
                gte: oneWeekAgo,
              },
            },
          },
        },
      },
    },
    orderBy: [{ favorites: { _count: "desc" } }],
    take: 6,
  });

  return popularRecipes.map((recipe) => {
  const totalRating = recipe.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  const averageRating =
    recipe.reviews.length > 0
      ? Math.round(totalRating / recipe.reviews.length)
      : 0;

  return {
    id: recipe.slug || recipe.id,
    title: recipe.title,
    image: recipe.imageUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
    rating: averageRating,
    author: {
      name: recipe.author.username,
      username: recipe.author.username,
      avatar: recipe.author.avatarUrl || "/img/users/default-avatar.png", // ✅ use actual DB avatar
    },
  };
});
}

async function getRecentRecipes() {
  const recentRecipes = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      author: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  });

  return recentRecipes.map((recipe) => {
    const totalRating = recipe.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      recipe.reviews.length > 0
        ? Math.round(totalRating / recipe.reviews.length)
        : 0;

    return {
      id: recipe.slug || recipe.id,
      title: recipe.title,
      image: recipe.imageUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
      time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
      rating: averageRating,
      author: {
  name: recipe.author.username,
  username: recipe.author.username,
  avatar: recipe.author.avatarUrl || "/img/users/default-avatar.png",
},
    };
  });
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          recipes: true,
        },
      },
    },
    orderBy: {
      recipes: {
        _count: "desc",
      },
    },
    take: 6,
  });

  return categories.map((category) => {
    const slug = category.name.toLowerCase().replace(/\s+/g, "-");
    return {
      slug: slug,
      name: category.name,
      image: getCategoryImage(category.name),
    };
  });
}

async function getFeaturedRecipe() {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED", reviews: { some: {} } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      imageUrl: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } },
      author: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("Fetched recipes for featured:", recipes);

  if (!recipes.length) return null;

  // Always have at least the first recipe
  let featured = recipes[0];
  let highestScore = 0;

  for (const r of recipes) {
    if (r._count.reviews >= 2) {
      const avg = r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r._count.reviews;
      const score = avg * Math.min(r._count.reviews / 5, 1);
      if (score > highestScore) {
        highestScore = score;
        featured = r;
      }
    }
  }

  return {
    id: featured.id,
    slug: featured.slug,
    username: featured.author.username,
    title: "Recipe of the Day",
    description:
      featured.description ||
      "Every day we feature an exceptional recipe that showcases the creativity and skill of our community. Today's featured dish combines fresh seasonal ingredients with classic techniques for an unforgettable dining experience.",
    image:
      featured.imageUrl ||
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop",
  };
}


async function getSpotlightChef() {
  const users = await prisma.user.findMany({
    where: {
      recipes: {
        some: {
          status: "PUBLISHED",
        },
      },
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      recipes: {
        select: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        where: {
          status: "PUBLISHED",
        },
      },
      _count: {
        select: {
          recipes: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
    orderBy: {
      recipes: {
        _count: "desc",
      },
    },
    take: 5,
  });

  let spotlight = null;
  let highestAvgRating = 0;

  for (const user of users) {
    if (user._count.recipes < 3) continue;

    let totalRatings = 0;
    let ratingCount = 0;

    user.recipes.forEach((recipe) => {
      recipe.reviews.forEach((review) => {
        totalRatings += review.rating;
        ratingCount++;
      });
    });

    const avgRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

    if (avgRating > highestAvgRating) {
      highestAvgRating = avgRating;
      spotlight = {
        id: user.id,
        name: user.username,
        title: "Home Cook & Food Blogger",
        avatar: user.avatarUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
        quote:
          user.bio ||
          "Cooking is my passion, and I love sharing family recipes that have been passed down through generations. My goal is to help others discover the joy of creating delicious meals from scratch.",
      };
    }
  }

  if (!spotlight && users.length > 0) {
    const topContributor = users[0];
    spotlight = {
      id: topContributor.id,
      name: topContributor.username,
      title: "Home Cook & Food Blogger",
      avatar: topContributor.avatarUrl || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
      quote:
        topContributor.bio ||
        "Sharing my passion for food through delicious recipes.",
    };
  }

  return spotlight;
}

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
<section className="relative text-center text-bg h-[500px] flex items-center">
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
      className="absolute inset-0 bg-gradient-to-br from-accent/85 to-accent-hover/90"
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