import { Search, ChefHat } from "lucide-react";

interface BrowseEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export default function BrowseEmptyState({ hasFilters, onClearFilters }: BrowseEmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
      <div className="max-w-md mx-auto">
        {hasFilters ? (
          <>
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No recipes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn&apos;t find any recipes matching your filters. Try adjusting your search criteria or clearing some filters.
            </p>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
              >
                Clear All Filters
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat size={40} className="text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No recipes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to share a delicious recipe with the community!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
