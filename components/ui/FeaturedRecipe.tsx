import Link from "next/link";
import Image from "next/image";
import Button from "../Button";
import { Star } from "lucide-react";

export default function FeaturedRecipe({ featured }) {
  return (
    <section className="bg-gradient-to-br from-[#fef9f7] to-[#fdf1ea] py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Image
            src={featured.image}
            alt={featured.title}
            width={500}
            height={300}
            className="rounded-2xl object-cover w-full h-[300px]"
            priority
          />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#b85c42] mb-4">
            {featured.title}
          </h3>
          <p className="text-gray-600 mb-8">{featured.description}</p>
          <Button as={Link} href={`/recipes/${featured.id}`} variant="primary" size="md">
            <Star size={20} /> View Featured Recipe
          </Button>
        </div>
      </div>
    </section>
  );
}