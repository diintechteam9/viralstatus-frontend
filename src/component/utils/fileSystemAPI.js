// Store for file handles and metadata
const STORAGE_KEYS = {
  images: 'content_library_images',
  videos: 'content_library_videos',
  audio: 'content_library_audio'
};

// Initialize storage
const initializeStorage = (type) => {
  const currentData = localStorage.getItem(STORAGE_KEYS[type]);
  if (!currentData) {
    const initialData = {
      categories: {}
    };
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(currentData);
};

// Get storage data
const getStorageData = (type) => {
  return initializeStorage(type);
};

// Save storage data
const saveStorageData = (data, type) => {
  if (!data || !data.categories) {
    data = { categories: {} };
  }
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(data));
};

// Get content type from file
const getContentType = (file) => {
  if (file.type.startsWith('image/')) return 'images';
  if (file.type.startsWith('video/')) return 'videos';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'images'; // default to images
};

// Create folder
export const createFolder = async (path, category, type) => {
  try {
    let storage = getStorageData(type);
    const folderName = path.split('/').pop();
    
    // Ensure storage has categories object
    if (!storage.categories) {
      storage.categories = {};
    }
    
    // Initialize category if it doesn't exist
    if (!storage.categories[category]) {
      storage.categories[category] = {
        folders: [],
        files: {}
      };
    }

    // Check if folder already exists in this category
    const existingFolder = storage.categories[category].folders.find(f => f.name === folderName);
    
    if (!existingFolder) {
      // Add new folder to category
      storage.categories[category].folders.push({
        name: folderName,
        path,
        createdAt: new Date().toISOString()
      });

      // Initialize files array for this folder
      storage.categories[category].files[path] = [];
    }

    saveStorageData(storage, type);
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Save file
export const saveFile = async (folderPath, file, category) => {
  try {
    const type = getContentType(file);
    let storage = getStorageData(type);
    
    // Ensure storage has categories object
    if (!storage.categories) {
      storage.categories = {};
    }
    
    // Ensure category exists
    if (!storage.categories[category]) {
      storage.categories[category] = {
        folders: [],
        files: {}
      };
    }

    // Ensure folder exists in category
    const folderName = folderPath.split('/').pop();
    const existingFolder = storage.categories[category].folders.find(f => f.name === folderName);
    
    if (!existingFolder) {
      // Add new folder to category
      storage.categories[category].folders.push({
        name: folderName,
        path: folderPath,
        createdAt: new Date().toISOString()
      });
    }
    
    // Initialize files array for this folder if it doesn't exist
    if (!storage.categories[category].files[folderPath]) {
      storage.categories[category].files[folderPath] = [];
    }

    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);

    const base64Data = await base64Promise;

    // Check if file with same name already exists
    const existingFileIndex = storage.categories[category].files[folderPath].findIndex(
      f => f.name === file.name
    );

    if (existingFileIndex !== -1) {
      // Update existing file
      storage.categories[category].files[folderPath][existingFileIndex] = {
        name: file.name,
        type: file.type,
        data: base64Data,
        size: file.size,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new file
      storage.categories[category].files[folderPath].push({
        name: file.name,
        type: file.type,
        data: base64Data,
        size: file.size,
        createdAt: new Date().toISOString()
      });
    }

    saveStorageData(storage, type);
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Get folders
export const getFolders = async (type) => {
  try {
    const storage = getStorageData(type);
    if (!storage.categories) {
      return [];
    }
    return Object.entries(storage.categories).map(([category, data]) => ({
      name: category,
      folders: data.folders || []
    }));
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
};

// Get files in folder
export const getFilesInFolder = async (folderPath, category, type) => {
  try {
    const storage = getStorageData(type);
    if (!storage.categories?.[category]?.files?.[folderPath]) {
      return [];
    }
    const files = storage.categories[category].files[folderPath];
    
    return files.map(file => ({
      name: file.name,
      url: file.data,
      type: file.type,
      size: file.size
    }));
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
};

// Delete folder
export const deleteFolder = async (folderPath, category, type) => {
  try {
    const storage = getStorageData(type);
    
    if (!storage.categories?.[category]) {
      throw new Error('Category not found');
    }
    
    // Remove folder from category's folders array
    storage.categories[category].folders = storage.categories[category].folders.filter(f => f.path !== folderPath);
    
    // Remove folder's files
    delete storage.categories[category].files[folderPath];

    // Remove category if it has no folders
    if (storage.categories[category].folders.length === 0) {
      delete storage.categories[category];
    }
    
    saveStorageData(storage, type);
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (category, type) => {
  try {
    const storage = getStorageData(type);
    
    if (!storage.categories?.[category]) {
      throw new Error('Category not found');
    }
    
    // Remove the entire category
    delete storage.categories[category];
    
    saveStorageData(storage, type);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}; 