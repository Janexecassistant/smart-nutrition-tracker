"use client";

import { AuthGuard } from "@/components/auth-guard";
import { RecipeBuilder } from "@/components/recipe-builder";

export default function NewRecipePage() {
  return (
    <AuthGuard>
      <RecipeBuilder mode="create" />
    </AuthGuard>
  );
}
