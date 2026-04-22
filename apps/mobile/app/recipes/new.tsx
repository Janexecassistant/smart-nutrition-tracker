import { Stack } from "expo-router";
import { RecipeBuilder } from "../../src/components/recipe-builder";

export default function NewRecipeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "New Recipe" }} />
      <RecipeBuilder mode="create" />
    </>
  );
}
