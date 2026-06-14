export interface AvatarPreset {
  id:       string;
  emoji:    string;
  gradient: [string, string];
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'fox',     emoji: '🦊', gradient: ['#FF6B6B', '#FF8E53'] },
  { id: 'panda',   emoji: '🐼', gradient: ['#6C63FF', '#A78BFA'] },
  { id: 'lion',    emoji: '🦁', gradient: ['#F59E0B', '#FB923C'] },
  { id: 'penguin', emoji: '🐧', gradient: ['#3B82F6', '#06B6D4'] },
  { id: 'cat',     emoji: '🐱', gradient: ['#F97316', '#EF4444'] },
  { id: 'owl',     emoji: '🦉', gradient: ['#8B5CF6', '#EC4899'] },
  { id: 'deer',    emoji: '🦌', gradient: ['#10B981', '#059669'] },
  { id: 'unicorn', emoji: '🦄', gradient: ['#EC4899', '#A855F7'] },
  { id: 'robot',   emoji: '🤖', gradient: ['#14B8A6', '#0284C7'] },
  { id: 'dragon',  emoji: '🐲', gradient: ['#22C55E', '#16A34A'] },
  { id: 'alien',   emoji: '👽', gradient: ['#A3E635', '#10B981'] },
  { id: 'ninja',   emoji: '🥷', gradient: ['#475569', '#1E293B'] },
];

export function getAvatar(id: string | null | undefined): AvatarPreset {
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
}
