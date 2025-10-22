import Link from "next/link";
import Image from "next/image";
import Button from "../Button";
import { User, Utensils } from "lucide-react";

export default function ChefSpotlight({ chef }) {
  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={chef.avatar}
              alt={chef.name}
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
            <div>
              <div className="font-semibold text-lg text-gray-900">
                {chef.name}
              </div>
              <div className="text-gray-500 text-sm">{chef.title}</div>
            </div>
          </div>
          <p className="text-gray-700 mb-6">{chef.quote}</p>
          <div className="flex gap-3">
            <Button as={Link} href={`/chefs/${chef.id}`} variant="secondary" size="md">
              <User size={18} /> View Profile
            </Button>
            <Button as={Link} href={`/chefs/${chef.id}/recipes`} variant="primary" size="md">
              <Utensils size={18} /> See Recipes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}