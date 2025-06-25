// Function to create a folder
export const createFolder = async (folderPath) => {
  try {
    const response = await fetch('/api/create-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: folderPath }),
    });

    
    if (!response.ok) {
      throw new Error('Failed to create folder');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Function to save a file
export const saveFile = async (folderPath, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', folderPath);

    const response = await fetch('/api/save-file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Function to get all folders
export const getFolders = async () => {
  try {
    const response = await fetch('/api/get-folders');
    if (!response.ok) {
      throw new Error('Failed to get folders');
      console.log('getfolder response',response);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting folders:', error);
    throw error;
  }
};

// Function to get files in a folder
export const getFilesInFolder = async (folderPath) => {
  try {
    const response = await fetch(`/api/get-files?path=${encodeURIComponent(folderPath)}`);
    if (!response.ok) {
      throw new Error('Failed to get files');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
}; 