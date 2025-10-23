"use client";

import ProtectedPage from "@/components/ProtectedPage";

export default function NewRecipePage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Create New Recipe</h1>
          {/* TODO: Add recipe creation form */}
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-500">Recipe creation form coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              This page will allow authenticated users to create and submit new recipes.
            </p>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
} 