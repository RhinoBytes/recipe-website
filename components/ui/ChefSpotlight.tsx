import Image from "next/image";
import Button from "../Button";
import { User, Utensils } from "lucide-react";
import type { Chef } from "@/types";

interface ChefSpotlightProps {
  chef: Chef;
}

export default function ChefSpotlight({ chef }: ChefSpotlightProps) {
  return (
    <section className="py-16 bg-bg">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-bg-secondary rounded-2xl shadow-lg p-8 border-2 border-border">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={chef.avatar}
              alt={chef.name}
              width={60}
              height={60}
              className="rounded-full object-cover border-2 border-accent"
            />
            <div>
              <div className="font-semibold font-heading text-lg text-text">
                {chef.name}
              </div>
              <div className="text-text-secondary text-sm">{chef.title}</div>
            </div>
          </div>
          <p className="text-text-secondary mb-6">{chef.quote}</p>
          <div className="flex gap-3">
            <Button as="link" href={`/chefs/${chef.id}`} variant="secondary" size="md">
              <User size={18} /> View Profile
            </Button>
            <Button as="link" href={`/chefs/${chef.id}/recipes`} variant="primary" size="md">
              <Utensils size={18} /> See Recipes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}