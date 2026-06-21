import { memo, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@constants/index';
import { useCategoryStore, getCategoryById, type CategoryDef } from '@store/categoryStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryIconProps {
  category: string;
  size?: number;
  source?: 'ledger' | 'budget' | 'general' | 'loan';
}

export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = 44,
  source,
}: CategoryIconProps) {
  const categories = useCategoryStore((s) => s.categories);

  const def: CategoryDef = useMemo(() => {
    if (source === 'ledger') {
      return {
        id: 'ledger',
        label: 'Ledger',
        icon: 'people-outline',
        color: '#8B5CF6',
        isCustom: false,
        applicableTo: 'both',
      };
    }
    if (source === 'budget') {
      return {
        id: 'budget',
        label: 'Budget',
        icon: 'receipt-outline',
        color: '#10B981',
        isCustom: false,
        applicableTo: 'both',
      };
    }
    if (source === 'loan' || category === 'Loan Payment' || category === 'Loan Principal') {
      return {
        id: 'loan',
        label: category === 'Loan Principal' ? 'Loan Principal' : 'Loan Payment',
        icon: category === 'Loan Principal' ? 'cash-outline' : 'repeat-outline',
        color: '#3B82F6',
        isCustom: false,
        applicableTo: 'both',
      };
    }
    return categories.find((c) => c.id === category) ?? getCategoryById(category);
  }, [category, categories, source]);

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
