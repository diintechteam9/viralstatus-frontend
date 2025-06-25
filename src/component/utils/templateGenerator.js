import { availableImages, availableMusic } from './mediaFiles';

// Function to get random items from an array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Main function to generate template
export async function generateTemplate(numImages, duration, options = {}) {
  try {
    if (availableImages.length === 0) {
      throw new Error('No images found in the public/images folder. Please add images to the public/images folder and update the availableImages list in mediaFiles.js');
    }

    // Select random images and music
    const selectedImages = getRandomItems(availableImages, Math.min(numImages, availableImages.length));
    const selectedMusic = availableMusic.length > 0 ? getRandomItems(availableMusic, 1)[0] : null;

    // Calculate duration per image, accounting for inrow and outrow if enabled
    let effectiveDuration = duration;
    if (options.showInrow) {
      effectiveDuration = duration - 2; // Subtract 2 seconds for inrow
    }
    if (options.showOutrow) {
      effectiveDuration = duration - 2; // Subtract 2 seconds for outrow
    }
    const durationPerImage = effectiveDuration / selectedImages.length;

    // Create media files array with exact timing
    const mediaFiles = selectedImages.map((imageName, index) => ({
      file: null,
      url: `/images/${imageName}`,
      type: 'image',
      name: imageName,
      start: index * durationPerImage,
      duration: durationPerImage,
      end: (index + 1) * durationPerImage,
      trimmed: true, // Mark as trimmed to ensure exact duration
      trimStart: 0,
      trimEnd: durationPerImage
    }));

    // Create music file with exact duration
    const musicFiles = selectedMusic ? [{
      file: null,
      url: `/music/${selectedMusic}`,
      type: 'audio',
      name: selectedMusic,
      start: 0,
      end: duration,
      trimmed: true, // Mark as trimmed to ensure exact duration
      trimStart: 0,
      trimEnd: duration,
      duration: duration // Add explicit duration
    }] : [];

    return { mediaFiles, musicFiles };
  } catch (error) {
    console.error('Error generating template:', error);
    throw error;
  }
} 