import { redirect } from "next/navigation";

export default async function OldRecipePage({
  params,
}: {
  params: Promise<{ recipe: string }>;
}) {
  const { recipe: recipeSlug } = await params;
  redirect(`/recipes/${recipeSlug}`);
}
 