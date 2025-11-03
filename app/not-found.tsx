import Link from 'next/link';
import { Home, Search, ChefHat } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light to-secondary-light flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <ChefHat className="mx-auto text-accent" size={120} strokeWidth={1.5} />
        </div>

        {/* 404 Text */}
        <h1 className="text-9xl font-bold text-accent mb-4">404</h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
          Oops! Recipe Not Found
        </h2>
        
        <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
          Looks like this recipe has been eaten! The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
          >
            <Home size={20} />
            Back to Home
          </Link>
          
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 bg-bg-secondary text-text font-semibold rounded-lg hover:bg-bg border-2 border-border transition-colors"
          >
            <Search size={20} />
            Browse Recipes
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-text-secondary mb-3">
            Looking for something specific? Try these:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/browse?q=pasta"
              className="text-sm text-accent hover:text-accent-hover underline"
            >
              Pasta Recipes
            </Link>
            <span className="text-text-muted">•</span>
            <Link
              href="/browse?q=dessert"
              className="text-sm text-accent hover:text-accent-hover underline"
            >
              Desserts
            </Link>
            <span className="text-text-muted">•</span>
            <Link
              href="/browse?q=quick"
              className="text-sm text-accent hover:text-accent-hover underline"
            >
              Quick Meals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
