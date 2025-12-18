// Collection of avatar emojis/icons for users to choose from
export const avatars = [
  '🦊', '🐱', '🐶', '🐼', '🐨', '🦁',
  '🐯', '🐻', '🐰', '🦄', '🐲', '🦋'
];

export const getAvatar = (index: number): string => {
  return avatars[index % avatars.length];
};

export const avatarColors = [
  'from-orange-400 to-red-500',
  'from-purple-400 to-pink-500',
  'from-blue-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-yellow-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-purple-500',
  'from-teal-400 to-green-500',
  'from-rose-400 to-red-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-yellow-500',
  'from-violet-400 to-indigo-500',
];

export const getAvatarColor = (index: number): string => {
  return avatarColors[index % avatarColors.length];
};
