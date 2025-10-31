import Image from "next/image";
import Button from "@/components/ui/Button";
import { Star } from "lucide-react";
import type { FeaturedRecipe } from "@/types";

interface FeaturedRecipeProps {
  featured: FeaturedRecipe;
}

export default function FeaturedRecipe({ featured }: FeaturedRecipeProps) {
  return (
    <section className="bg-gradient-to-br from-accent-light to-secondary-light py-16 min-h-[400px]">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative w-full h-[300px] flex-shrink-0">
          <Image
            src={featured.image}
            alt={featured.title}
            fill
            className="rounded-2xl object-cover border-2 border-border shadow-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        <div>
          <h3 className="text-2xl font-bold font-heading text-accent mb-4">
            {featured.title}
          </h3>
          <p className="text-text-secondary mb-8">{featured.description}</p>
          <Button as="link" href={`/recipes/${featured.username}/${featured.slug}`} variant="primary" size="md">
            <Star size={20} /> View Featured Recipe
          </Button>
        </div>
      </div>
    </section>
  );
}