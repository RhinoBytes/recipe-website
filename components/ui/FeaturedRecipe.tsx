import Image from "next/image";
import Button from "../Button";
import { Star } from "lucide-react";
import type { FeaturedRecipe } from "@/types";

interface FeaturedRecipeProps {
  featured: FeaturedRecipe;
}

export default function FeaturedRecipe({ featured }: FeaturedRecipeProps) {
  return (
    <section className="bg-gradient-to-br from-accent-light to-secondary-light py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Image
            src={featured.image}
            alt={featured.title}
            width={500}
            height={300}
            className="rounded-2xl object-cover w-full h-[300px] border-2 border-border shadow-lg"
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