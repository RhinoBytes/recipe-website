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
    <div className="flex gap-3 mb-6">
      <Button
        onClick={handleEdit}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <Edit size={18} />
        Edit Recipe
      </Button>
      
      {!showDeleteConfirm ? (
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          variant="secondary"
          className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
        >
          <Trash2 size={18} />
          Delete Recipe
        </Button>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <span className="text-red-800 font-medium">Are you sure?</span>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="secondary"
            className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 text-sm"
          >
            {deleting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            variant="secondary"
            className="px-3 py-1 text-sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
