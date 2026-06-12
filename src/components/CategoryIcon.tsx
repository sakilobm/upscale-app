import { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@constants/index';
import { useCategoryStore, getCategoryById, type CategoryDef } from '@store/categoryStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryIconProps {
  category: string;
  size?: number;
}

export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = 44,
}: CategoryIconProps) {
  const categories = useCategoryStore((s) => s.categories);
  const def: CategoryDef =
    categories.find((c) => c.id === category) ?? getCategoryById(category);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: Radius.md,
    backgroundColor: def.color + '1E',
    borderWidth: 1,
    borderColor: def.color + '3C',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle}>
      <Ionicons
        name={def.icon as IoniconName}
        size={size * 0.48}
        color={def.color}
      />
    </View>
  );
});

export { getCategoryById };
export type { CategoryDef };
