/**
 * @file useCategoriesScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Manages all state for the Categories screen: form sheet visibility,
 *   edit target, and delete operations. Computed views (builtIn/custom split) are
 *   derived here so the screen shell stays purely declarative.
 * @associatedFiles src/store/categoryStore.ts, src/app/categories.tsx,
 *   src/components/categories/CategoryCard.tsx
 */

import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useCategoryStore, type CategoryDef } from '@store/categoryStore';
import { toast } from '@store/toastStore';

export function useCategoriesScreen() {
  const { categories, deleteCategory } = useCategoryStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget,  setEditTarget]  = useState<CategoryDef | null>(null);

  const builtIn = categories.filter((c) => !c.isCustom);
  const custom  = categories.filter((c) => c.isCustom);

  const openCreate = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit   = (cat: CategoryDef) => { setEditTarget(cat); setFormVisible(true); };
  const closeForm  = () => { setFormVisible(false); setEditTarget(null); };

  const handleDelete = (cat: CategoryDef) => {
    deleteCategory(cat.id);
    toast.info(`"${cat.label}" removed`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return {
    builtIn,
    custom,
    formSheet: {
      isVisible:  formVisible,
      editTarget,
      openCreate,
      close:      closeForm,
    },
    handlers: {
      openEdit,
      handleDelete,
    },
  };
}
