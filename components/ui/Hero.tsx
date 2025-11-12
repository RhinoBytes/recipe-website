import Image from "next/image";
import Button from "@/components/ui/Button";
import { Flame, Compass } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative text-center text-bg min-h-[500px] flex items-center">
      <div className="h-20 flex-shrink-0" />

      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 w-full h-full bg-center bg-cover">
        <Image
          src="/img/Hero/Hero.jpeg"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="/img/Hero/Hero-small.jpg" // tiny blurred version
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--card-gradient)" }}
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
          <Button as="link" href="/browse?sort=popular" variant="primary" size="lg">
            <Flame size={22} /> Start Cooking
          </Button>
          <Button as="link" href="/browse" variant="primary" size="lg">
            <Compass size={22} /> Browse Recipes
          </Button>
        </div>
      </div>
    </section>
  );
}
