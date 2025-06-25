import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FaPlus, FaTimes, FaFolderPlus, FaEllipsisV, FaEdit, FaTrash, FaAngleLeft, FaFolder } from 'react-icons/fa';

const CategoryTab = ({ categories, setCategories, loading, error }) => {
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewSubcategoryModal, setShowNewSubcategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [showMenuForCategory, setShowMenuForCategory] = useState(null);
    const [showMenuForSubCategory, setShowMenuForSubCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [formData, setFormData] = useState({
      name: '',
      description: ''
    });
  const [localError, setLocalError] = useState('');

  // Get client authentication data
  const getClientAuth = () => {
    const clientData = sessionStorage.getItem('userData');
    const token = sessionStorage.getItem('clienttoken');
    
    if (!clientData || !token) {
      return { clientId: null, token: null };
    }

    try {
      const parsedClientData = JSON.parse(clientData);
      return {
        clientId: parsedClientData.clientId,
        token: token
      };
    } catch (error) {
      console.error('Error parsing client data:', error);
      return { clientId: null, token: null };
    }
  };

  // Update fetchCategories to include subcategories
  const fetchCategories = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.categories) {
        // Fetch subcategories for each category
        const categoriesWithSubcategories = await Promise.all(
          response.data.categories.map(async (category) => {
            try {
              const subcategoriesResponse = await axios.get(
                `${API_BASE_URL}/api/categories/${category._id}/subcategories`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              return {
                ...category,
                subcategories: subcategoriesResponse.data.subcategories || []
              };
            } catch (err) {
              console.error(`Error fetching subcategories for category ${category._id}:`, err);
            return {
                ...category,
                subcategories: []
              };
            }
          })
        );

        setCategories(categoriesWithSubcategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setLocalError('Failed to fetch categories');
    }
  };

  // Remove the separate fetchSubcategories function since we're now fetching them with categories
  const toggleSubCategories = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle menu click for categories
  const handleMenuClick = (e, categoryId) => {
    e.stopPropagation();
    setShowMenuForCategory(showMenuForCategory === categoryId ? null : categoryId);
      setShowMenuForSubCategory(null);
    };

  // Handle menu click for subcategories
  const handleSubMenuClick = (e, subcategoryId) => {
    e.stopPropagation();
    setShowMenuForSubCategory(showMenuForSubCategory === subcategoryId ? null : subcategoryId);
    setShowMenuForCategory(null);
  };

  // Create new category
  const handleCreateCategory = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/categories`,
        {
          name: formData.name,
          description: formData.description
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setFormData({ name: '', description: '' });
      setShowNewCategoryModal(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      setLocalError('Failed to create category');
    }
  };

  // Update handleCreateSubcategory to update the categories state directly
  const handleCreateSubcategory = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
        return;
      }

      if (!selectedCategory || !selectedCategory._id) {
        setLocalError('Please select a category first');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/categories/${selectedCategory._id}/subcategories`,
        {
          name: formData.name,
          description: formData.description,
          parentId: selectedCategory._id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.subcategory) {
        // Update categories state with the new subcategory
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category._id === selectedCategory._id
              ? {
                  ...category,
                  subcategories: [...(category.subcategories || []), {
                    ...response.data.subcategory,
                    parentId: selectedCategory._id
                  }]
                }
              : category
          )
        );

        // Reset form and close modal
        setFormData({ name: '', description: '' });
        setShowNewSubcategoryModal(false);
        setSelectedCategory(null);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error creating subcategory:', err);
      setLocalError(err.response?.data?.message || 'Failed to create subcategory');
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
          return;
        }
        
      await axios.put(
        `${API_BASE_URL}/api/categories/${selectedCategory._id}`,
        {
          name: formData.name,
          description: formData.description
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setFormData({ name: '', description: '' });
      setShowEditCategoryModal(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setLocalError('Failed to update category');
    }
  };

  // Update subcategory
  const handleUpdateSubcategory = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
        return;
      }

      await axios.put(
        `${API_BASE_URL}/api/categories/${selectedCategory._id}/subcategories/${selectedSubcategory._id}`,
        {
          name: formData.name,
          description: formData.description
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setFormData({ name: '', description: '' });
      setShowEditSubcategoryModal(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error updating subcategory:', err);
      setLocalError('Failed to update subcategory');
    }
  };

  // Update handleDeleteSubcategory to update the categories state directly
  const handleDeleteSubcategory = async () => {
    try {
      const { clientId, token } = getClientAuth();
      if (!clientId || !token) {
        setLocalError('Authentication required. Please log in again.');
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/api/categories/${selectedCategory._id}/subcategories/${selectedSubcategory._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update categories state by removing the deleted subcategory
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category._id === selectedCategory._id
            ? {
                ...category,
                subcategories: category.subcategories.filter(
                  sub => sub._id !== selectedSubcategory._id
                )
              }
            : category
        )
      );

      setShowDeleteModal(false);
      } catch (err) {
      console.error('Error deleting subcategory:', err);
      setLocalError('Failed to delete subcategory');
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
      [name]: value
      }));
    };

  // Effect to fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Effect to fetch subcategories when a category is expanded
  useEffect(() => {
    Object.entries(expandedCategories).forEach(([categoryId, isExpanded]) => {
      if (isExpanded) {
        const category = categories.find(cat => cat._id === categoryId);
        if (category && !category.subcategories) {
          fetchCategories();
        }
      }
    });
  }, [expandedCategories, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('clienttoken');
      if (!token) {
        setLocalError('Authentication required');
        return;
      }

      if (showEditCategoryModal || showEditSubcategoryModal) {
        // Handle updates
        if (selectedSubcategory) {
          await handleUpdateSubcategory();
        } else {
          await handleUpdateCategory();
        }
      } else {
        // Handle creation
        if (showNewSubcategoryModal) {
          await handleCreateSubcategory();
        } else if (showNewCategoryModal) {
          await handleCreateCategory();
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setLocalError(err.response?.data?.message || 'Failed to submit form');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
          </div>
          {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowNewCategoryModal(true);
                setSelectedCategory(null);
              }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto justify-center"
            >
                <FaPlus /> Add Category
            </button>
          </div>
          )}
        </div>

      {/* Error Message */}
      {localError && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm sm:text-base">
          {localError}
        </div>
      )}

      {/* Empty State or Categories List */}
        {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-50 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FaFolderPlus className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Create Your First Category</h3>
            <p className="text-gray-600 mb-8 text-base">
              Categories help you organize your content efficiently. Let's create your first category to get started.
              </p>
              <button
              onClick={() => {
                setShowNewCategoryModal(true);
                setSelectedCategory(null);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mx-auto text-base font-medium shadow-sm hover:shadow-md"
            >
              <FaPlus /> Create Category
              </button>
          </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category._id} className="bg-pink-50 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 truncate">{category.name}</h3>
                    <p className="text-xs text-gray-600 truncate mb-1">{category.description}</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setShowNewSubcategoryModal(true);
                    }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                    >
                      <FaPlus size={10} /> Add Sub
                    </button>
                    <div className="relative">
                      <button
                      onClick={(e) => handleMenuClick(e, category._id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <FaEllipsisV size={14} className="text-gray-600" />
                      </button>
                    {showMenuForCategory === category._id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                            setFormData({
                              name: category.name,
                              description: category.description
                            });
                            setShowEditCategoryModal(true);
                          }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaEdit size={12} /> Edit
                          </button>
                          <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                            setShowDeleteModal(true);
                          }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <FaTrash size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              {/* Subcategories Section */}
                  <div className="mt-2 pt-2 border-t">
                    <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubCategories(category._id);
                  }}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors w-full"
                    >
                  <span>
                    Sub Categories 
                    {loading && expandedCategories[category._id] ? (
                      <span className="text-gray-500"> (Loading...)</span>
                    ) : (
                      <span> ({category.subcategories?.length || 0})</span>
                    )}
                  </span>
                      <FaAngleLeft 
                        className={`transform transition-transform duration-200 ${
                      expandedCategories[category._id] ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                {expandedCategories[category._id] && (
                      <div className="mt-2 space-y-1">
                    {loading ? (
                      <div className="text-center py-2 text-gray-500 text-xs">
                        Loading subcategories...
                      </div>
                    ) : category.subcategories?.length > 0 ? (
                      category.subcategories.map((subCat) => (
                        <div key={subCat._id} className="bg-green-50 p-2 rounded text-xs">
                            <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-medium truncate">{subCat.name}</p>
                                <p className="text-gray-500 text-[10px]">
                                  Created: {new Date(subCat.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(category);
                                  setSelectedSubcategory(subCat);
                                  setFormData({
                                    name: subCat.name,
                                    description: subCat.description
                                  });
                                  setShowEditSubcategoryModal(true);
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-[10px]"
                              >
                                <FaEdit size={8} /> Edit
                              </button>
                              <div className="relative">
                      <button
                                  onClick={(e) => handleSubMenuClick(e, subCat._id)}
                                  className="p-1 hover:bg-gray-100 rounded-full"
                      >
                                  <FaEllipsisV size={12} className="text-gray-600" />
                      </button>
                                {showMenuForSubCategory === subCat._id && (
                                  <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(category);
                                        setSelectedSubcategory(subCat);
                                        setShowDeleteModal(true);
                                      }}
                                      className="w-full px-2 py-1 text-left text-xs text-red-600 hover:bg-gray-100 flex items-center gap-1"
                                    >
                                      <FaTrash size={10} /> Delete
                      </button>
                    </div>
                                )}
                  </div>
                </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-xs">
                        No subcategories found
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>
        )}

      {/* Create Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {categories.length === 0 ? 'Create Your First Category' : 'Create New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                    placeholder="Enter category name"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                    placeholder="Enter category description"
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
              </div>

            {localError && (
              <div className="mt-4 text-red-600 text-sm">{localError}</div>
            )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                  setShowNewCategoryModal(false);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                  }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                {loading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Create SubCategory Modal */}
      {showNewSubcategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Add Sub Category to {selectedCategory.name}
              </h2>
              <button
                onClick={() => {
                  setShowNewSubcategoryModal(false);
                  setSelectedCategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Category Name
                  </label>
                  <input
                    type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter sub category name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter sub category description"
                    rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

            {localError && (
              <div className="mt-4 text-red-600 text-sm">{localError}</div>
            )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                  setShowNewSubcategoryModal(false);
                    setSelectedCategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                  }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                {loading ? 'Creating...' : 'Create Sub Category'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Category</h2>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setSelectedCategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                    </label>
                    <input
                      type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>

            {localError && (
              <div className="mt-4 text-red-600 text-sm">{localError}</div>
            )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                  setShowEditCategoryModal(false);
                  setSelectedCategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Category'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Edit SubCategory Modal */}
      {showEditSubcategoryModal && selectedCategory && selectedSubcategory && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Sub Category</h2>
              <button
                onClick={() => {
                  setShowEditSubcategoryModal(false);
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Category Name
                  </label>
                  <input
                    type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>

            {localError && (
              <div className="mt-4 text-red-600 text-sm">{localError}</div>
            )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                  setShowEditSubcategoryModal(false);
                    setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setFormData({ name: '', description: '' });
                  setLocalError('');
                  }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Sub Category'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {selectedSubcategory ? 'subcategory' : 'category'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                  setShowDeleteModal(false);
                    setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={selectedSubcategory ? handleDeleteSubcategory : handleDeleteCategory}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default CategoryTab;
