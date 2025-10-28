export default function BrowseLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-bg-secondary rounded-2xl overflow-hidden shadow-md animate-pulse border border-border"
        >
          {/* Image skeleton */}
          <div className="w-full h-56 bg-border" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-5 bg-border rounded-lg w-3/4" />
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 bg-border-light rounded-lg w-full" />
              <div className="h-3 bg-border-light rounded-lg w-5/6" />
            </div>
            
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-border" />
              <div className="h-3 bg-border-light rounded-lg w-24" />
            </div>
            
            {/* Meta info */}
            <div className="flex gap-3">
              <div className="h-3 bg-border-light rounded-lg w-16" />
              <div className="h-3 bg-border-light rounded-lg w-16" />
              <div className="h-3 bg-border-light rounded-lg w-12" />
            </div>
            
            {/* Tags */}
            <div className="flex gap-2">
              <div className="h-6 bg-border-light rounded-lg w-16" />
              <div className="h-6 bg-border-light rounded-lg w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
