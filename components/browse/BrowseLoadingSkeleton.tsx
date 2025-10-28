export default function BrowseLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse"
        >
          {/* Image skeleton */}
          <div className="w-full h-56 bg-gray-300 dark:bg-gray-700" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
            </div>
            
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24" />
            </div>
            
            {/* Meta info */}
            <div className="flex gap-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12" />
            </div>
            
            {/* Tags */}
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-md w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-md w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
