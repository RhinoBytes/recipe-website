import Image from "next/image";
import { log } from "@/lib/logger";
import Button from "@/components/ui/Button";
import { User, Utensils } from "lucide-react";
import type { Chef } from "@/types";

interface ChefSpotlightProps {
  chef?: Chef | null;
}

export default function ChefSpotlight({ chef }: ChefSpotlightProps) {
  if (!chef) {
    return (
      <section className="py-16 bg-bg min-h-[300px] flex items-center justify-center">
        <p className="text-text-secondary text-xl">No chef spotlight available</p>
      </section>
    );
  }

  log.info({ chefId: chef.id }, "Chef spotlight rendered");

  return (
    <section className="py-16 bg-bg min-h-[300px]">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-bg-secondary rounded-2xl shadow-lg p-8 border-2 border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-[60px] h-[60px] flex-shrink-0">
              <Image
                src={chef.avatar || "/placeholder-chef.png"}
                alt={chef.name || "Chef"}
                fill
                className="rounded-full object-cover border-2 border-accent"
                sizes="60px"
              />
            </div>
            <div>
              <div className="font-semibold font-heading text-lg text-text">
                {chef.name || "Unknown Chef"}
              </div>
              <div className="text-text-secondary text-sm">{chef.title || ""}</div>
            </div>
          </div>
          <p className="text-text-secondary mb-6">{chef.quote || ""}</p>
          <div className="flex gap-3">
            <Button
              as="link"
              href={chef.id ? `/profile/${chef.id}` : "#"}
              variant="primary"
              size="md"
            >
              <User size={18} /> View Profile
            </Button>
            <Button
              as="link"
              href={`/browse?author=${encodeURIComponent(chef.name || "")}`}
              variant="primary"
              size="md"
            >
              <Utensils size={18} /> See Recipes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
