"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, Trash2, Loader2 } from "lucide-react";
import Button from "@/components/Button";

interface RecipeActionsProps {
  slug: string;
  isAuthor: boolean;
}

export default function RecipeActions({ slug, isAuthor }: RecipeActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isAuthor) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/recipes/edit/${slug}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      router.push("/profile");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete recipe. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-bg-secondary rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-text mb-4">Recipe Management</h3>
      
      {!showDeleteConfirm ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleEdit}
            variant="primary"
            className="flex items-center justify-center gap-2 w-full"
            aria-label="Edit recipe"
          >
            <Edit size={18} />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="secondary"
            className="flex items-center justify-center gap-2 w-full bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
            aria-label="Delete recipe"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-text font-medium mb-3">Are you sure you want to delete this recipe?</p>
            <p className="text-sm text-text-muted">This action cannot be undone.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="secondary"
              className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              aria-label="Confirm delete"
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span className="hidden sm:inline">Deleting...</span>
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="outline"
              aria-label="Cancel delete"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
