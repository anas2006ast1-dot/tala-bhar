import React from 'react'
import * as Icons from 'lucide-react'

/**
 * Maps emojis or icon names to Lucide SVG Icons.
 * If the icon cannot be mapped, it falls back to a default icon.
 */
export default function CategoryIcon({ name, className = '', size = 18 }) {
  if (!name) return null

  // Mapping emojis or common names to Lucide icon component names
  const mapping = {
    // Emojis mapping
    '🦐': 'Shrimp',
    '🍲': 'Soup',
    '🔥': 'Flame',
    '🐟': 'Fish',
    '🦑': 'Squid',
    '🍚': 'Utensils',
    '🥗': 'Salad',
    '🥤': 'CupSoda',
    '🍮': 'Cake',

    // Arabic keywords mapping
    'جمبري': 'Shrimp',
    'شوربة': 'Soup',
    'نار': 'Flame',
    'سمك': 'Fish',
    'أرز': 'Utensils',
    'سلطة': 'Salad',
    'مشروب': 'CupSoda',
    'حلوى': 'Cake',

    // English keywords mapping
    'shrimp': 'Shrimp',
    'soup': 'Soup',
    'flame': 'Flame',
    'fire': 'Flame',
    'grill': 'Flame',
    'fish': 'Fish',
    'squid': 'Squid',
    'rice': 'Utensils',
    'salad': 'Salad',
    'drink': 'CupSoda',
    'juice': 'CupSoda',
    'cake': 'Cake',
    'dessert': 'Cake',
    'meat': 'Beef',
    'pizza': 'Pizza',
    'coffee': 'Coffee'
  }

  const cleanName = name.trim().toLowerCase()
  const iconName = mapping[name] || mapping[cleanName] || name
  
  // Convert to PascalCase for Lucide matching
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  const IconComponent = Icons[pascalName] || Icons[iconName] || Icons.Utensils

  return <IconComponent className={className} size={size} />
}
