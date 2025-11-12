import { Search, ChefHat } from "lucide-react";

interface BrowseEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export default function BrowseEmptyState({ hasFilters, onClearFilters }: BrowseEmptyStateProps) {
  return (
    <div className="bg-bg-secondary rounded-2xl shadow-md border-2 border-border p-12 text-center">
      <div className="max-w-md mx-auto">
        {hasFilters ? (
          <>
            <div className="w-20 h-20 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-accent" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-text mb-3">
              No recipes found
            </h3>
            <p className="text-text-secondary mb-6">
              We couldn&apos;t find any recipes matching your filters. Try adjusting your search criteria or clearing some filters.
            </p>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="px-6 py-3 bg-accent text-white rounded-2xl hover:bg-accent-hover transition font-semibold shadow-md"
              >
                Clear All Filters
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat size={40} className="text-accent" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-text mb-3">
              No recipes yet
            </h3>
            <p className="text-text-secondary mb-6">
              Be the first to share a delicious recipe with the community!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
