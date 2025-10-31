import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/browse?categories=${encodeURIComponent(category.name)}`}
      className="relative bg-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition group border border-border"
    >
      <div className="relative w-full h-36">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
          priority={false}
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/80 to-accent-hover/80 text-bg font-semibold font-heading text-xl">
        <span className="drop-shadow">{category.name}</span>
      </div>
    </Link>
  );
}