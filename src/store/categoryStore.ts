import { create } from 'zustand';

export interface CategoryDef {
  id: string;
  label: string;
  icon: string;   // Ionicons name (e.g. 'home', 'fast-food')
  color: string;
  isCustom: boolean;
  applicableTo: 'expense' | 'income' | 'both';
}

export const PRESET_COLORS = [
  '#6366F1', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#34D399', '#38BDF8', '#F97316',
  '#22C55E', '#E11D48', '#0EA5E9', '#A855F7', '#94A3B8',
];

export const ICON_OPTIONS = [
  // Finance
  'wallet',      'cash',          'card',           'trending-up',    'trending-down',
  'stats-chart', 'bar-chart',     'pie-chart',      'business',       'receipt',
  // Home & Utilities
  'home',        'bed',           'construct',      'bulb',           'water',
  'flame',       'tv',            'key',            'shield',         'lock-closed',
  // Food & Drink
  'fast-food',   'restaurant',    'cafe',           'wine',           'nutrition',
  'pizza',       'beer',          'ice-cream',      'fish',           'leaf',
  // Transport
  'car',         'bus',           'airplane',       'bicycle',        'boat',
  'train',       'walk',          'navigate',       'location',       'map',
  // Health & Fitness
  'medkit',      'fitness',       'heart',          'bandage',        'pulse',
  'body',        'glasses',       'footsteps',      'bicycle',        'basketball',
  // Shopping
  'bag-handle',  'cart',          'pricetag',       'gift',           'shirt',
  'storefront',  'diamond',       'ribbon',         'star',           'bookmark',
  // Education
  'book',        'school',        'library',        'pencil',         'newspaper',
  'flask',       'calculator',    'clipboard',      'document-text',  'reader',
  // Entertainment
  'game-controller', 'film',      'musical-notes',  'headset',        'camera',
  'images',      'mic',           'radio',          'telescope',      'color-palette',
  // Tech
  'laptop',      'phone-portrait','desktop',        'hardware-chip',  'wifi',
  'bluetooth',   'cube',          'layers',         'code-slash',     'terminal',
  // People & Life
  'people',      'person',        'happy',          'paw',            'flower',
  'umbrella',    'sunny',         'moon',           'globe',          'earth',
] as const;

export type IoniconOption = typeof ICON_OPTIONS[number];

const BUILT_IN: CategoryDef[] = [
  { id: 'housing',       label: 'Housing',       icon: 'home',            color: '#6366F1', isCustom: false, applicableTo: 'expense' },
  { id: 'food',          label: 'Food',           icon: 'fast-food',       color: '#F59E0B', isCustom: false, applicableTo: 'expense' },
  { id: 'transport',     label: 'Transport',      icon: 'car',             color: '#3B82F6', isCustom: false, applicableTo: 'expense' },
  { id: 'health',        label: 'Health',         icon: 'medkit',          color: '#EF4444', isCustom: false, applicableTo: 'expense' },
  { id: 'entertainment', label: 'Entertainment',  icon: 'game-controller', color: '#8B5CF6', isCustom: false, applicableTo: 'expense' },
  { id: 'shopping',      label: 'Shopping',       icon: 'bag-handle',      color: '#EC4899', isCustom: false, applicableTo: 'expense' },
  { id: 'education',     label: 'Education',      icon: 'book',            color: '#818CF8', isCustom: false, applicableTo: 'expense' },
  { id: 'savings',       label: 'Savings',        icon: 'wallet',          color: '#10B981', isCustom: false, applicableTo: 'both' },
  { id: 'investment',    label: 'Investment',     icon: 'trending-up',     color: '#34D399', isCustom: false, applicableTo: 'both' },
  { id: 'salary',        label: 'Salary',         icon: 'briefcase',       color: '#22C55E', isCustom: false, applicableTo: 'income' },
  { id: 'freelance',     label: 'Freelance',      icon: 'laptop',          color: '#38BDF8', isCustom: false, applicableTo: 'income' },
  { id: 'gift',          label: 'Gift',           icon: 'gift',            color: '#F472B6', isCustom: false, applicableTo: 'both' },
  { id: 'other',         label: 'Other',          icon: 'cube',            color: '#94A3B8', isCustom: false, applicableTo: 'both' },
];

interface CategoryState {
  categories: CategoryDef[];
  addCategory: (cat: Omit<CategoryDef, 'id' | 'isCustom'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<CategoryDef, 'id' | 'isCustom'>>) => void;
  deleteCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: BUILT_IN,

  addCategory: (cat) =>
    set((state) => ({
      categories: [
        ...state.categories,
        { ...cat, id: `custom-${Date.now()}`, isCustom: true },
      ],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));

export function getCategoryById(id: string): CategoryDef {
  const cats = useCategoryStore.getState().categories;
  return (
    cats.find((c) => c.id === id) ?? {
      id: 'other',
      label: id.charAt(0).toUpperCase() + id.slice(1),
      icon: 'cube',
      color: '#94A3B8',
      isCustom: false,
      applicableTo: 'both',
    }
  );
}
