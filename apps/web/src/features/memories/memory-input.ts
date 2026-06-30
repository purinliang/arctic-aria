export type MemoryCategoryCandidate = {
  id: string;
  name: string;
};

export type MemoryCategorySelection = {
  categoryId?: string;
  categoryName?: string;
};

export function hasMemoryCategorySelection(
  selection: MemoryCategorySelection,
) {
  return Boolean(selection.categoryId || selection.categoryName?.trim());
}

export function resolveMemoryCategoryId(
  selection: MemoryCategorySelection,
  categories: MemoryCategoryCandidate[],
) {
  const categoryName = selection.categoryName?.trim().toLocaleLowerCase();

  if (categoryName) {
    const matchedCategory = categories.find(
      (category) => category.name.toLocaleLowerCase() === categoryName,
    );

    if (matchedCategory) {
      return matchedCategory.id;
    }
  }

  return selection.categoryId ?? "";
}
