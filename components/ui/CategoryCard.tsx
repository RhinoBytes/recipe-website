import Link from "next/link";
import Image from "next/image";

export default function CategoryCard({ category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
    >
      <div className="relative w-full h-36">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
          priority={false}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d4735a]/80 to-[#b85c42]/80 text-white font-semibold text-xl">
        <span className="drop-shadow">{category.name}</span>
      </div>
    </Link>
  );
}