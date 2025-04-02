/**
 * Icon Service
 * Handles mapping of node texts to icon filenames
 */

// Map of node text to filename for subject nodes
const subjectIconMap: Record<string, string> = {
  'Humans': 'humans',
  'Animals': 'animals',
  'Mythical Creatures': 'mythical-creatures',
  'Plants': 'plants',
  'Objects': 'objects',
  'Abstract Concepts': 'abstract-concepts',
  'Structures': 'structures',
  'Landscapes': 'landscapes'
};

/**
 * Get the relative path for a subject node's icon
 * @param text The text of the node
 * @returns The relative path to the image without URL resolution
 */
export function getSubjectIconFilename(text: string): string {
  // Look up the filename from the mapping or convert text to kebab-case
  return subjectIconMap[text] || text.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Icon Service
 * Handles the mapping and retrieval of icons for different node types
 */

// Map of zone names to their icon configuration
type IconMapping = Record<string, string>;
type ZoneIconConfig = {
  iconMap: IconMapping;
  showOnlyForParents: boolean;
  baseDir: string;
};

// Icons configuration by zone
const zoneIcons: Record<string, ZoneIconConfig> = {
  'Subject': {
    iconMap: {
      'Humans': 'humans',
      'Animals': 'animals',
      'Mythical Creatures': 'mythical-creatures',
      'Plants': 'plants',
      'Objects': 'objects',
      'Abstract Concepts': 'abstract-concepts',
      'Structures': 'structures',
      'Landscapes': 'landscapes'
    },
    showOnlyForParents: true,
    baseDir: '/assets/pics/subject'
  }
  // Add more zones here as needed, e.g.:
  // 'Mood': { ... }
};

/**
 * Gets the image path for a node in a specific zone
 * @param text The text of the node
 * @param zone The zone the node belongs to
 * @returns The path to the image, or null if no mapping exists
 */
export function getZoneIconPath(text: string, zone: string): string | null {
  const config = zoneIcons[zone];
  if (!config) return null;
  
  const { iconMap, baseDir } = config;
  const filename = iconMap[text] || text.toLowerCase().replace(/\s+/g, '-');
  
  // Use the URL constructor to properly resolve the path in the Nuxt.js application
  try {
    return new URL(`${baseDir}/${filename}.png`, import.meta.url).href;
  } catch (error) {
    console.error('Error resolving icon path:', error);
    return null;
  }
}

/**
 * Check if a node should display an icon
 * @param zone The zone of the node
 * @param isParent Whether the node is a parent node
 * @returns True if the node should display an icon
 */
export function shouldDisplayIcon(zone: string, isParent: boolean): boolean {
  const config = zoneIcons[zone];
  if (!config) return false;
  
  // If the zone config requires only parent nodes to show icons
  return !config.showOnlyForParents || isParent;
}

/**
 * Get the appropriate icon path for a node
 * @param text The text of the node
 * @param zone The zone of the node
 * @param isParent Whether the node is a parent node
 * @returns The path to the icon or null if no icon should be displayed
 */
export function getIconPath(text: string, zone: string, isParent: boolean): string | null {
  if (!shouldDisplayIcon(zone, isParent)) {
    return null;
  }
  
  return getZoneIconPath(text, zone);
}

/**
 * Register icons for a new zone
 * @param zone The zone name
 * @param config The icon configuration for the zone
 */
export function registerZoneIcons(zone: string, config: ZoneIconConfig): void {
  zoneIcons[zone] = config;
} 