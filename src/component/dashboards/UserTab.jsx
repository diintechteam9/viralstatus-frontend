import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaVenusMars,
  FaBirthdayCake,
  FaBriefcase,
  FaGraduationCap,
  FaTools,
  FaInstagram,
  FaYoutube,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

const UserTab = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userProfile, setUserProfile] = useState({
    // Personal Information
    name: "",
    email: "",
    mobileNumber: "",
    city: "",
    gender: "",
    ageRange: "",

    // Business Interests (multiple selection)
    businessInterests: [],

    // Occupation
    occupation: "",

    // Education
    highestQualification: "",
    fieldOfStudy: "",

    // Skills (multiple selection)
    skills: [],

    // Social Media
    socialMedia: {
      instagram: {
        handle: "",
        followersCount: "",
        url: "",
      },
      youtube: {
        channelUrl: "",
        subscribers: "",
      },
    },
  });

  const [tempProfile, setTempProfile] = useState({});

  // Business Interests Options
  const businessInterestsOptions = [
    "Fashion & Lifestyle",
    "Beauty & Cosmetics",
    "Health & Wellness",
    "Travel & Tourism",
    "Food & Beverages",
    "Tech & Gadgets",
    "Finance & Investing",
    "Parenting & Family",
    "Education & EdTech",
    "Gaming & eSports",
    "Fitness & Sports",
    "Music & Entertainment",
    "Luxury & Automobiles",
    "Environment & Sustainability",
    "Startups & Entrepreneurship",
    "Books & Literature",
    "Home Decor & Interiors",
    "Pet Care",
    "Non-Profit & Social Causes",
  ];

  // Occupation Options
  const occupationOptions = [
    "Student",
    "Freelancer",
    "Content Creator (Full-Time)",
    "Actor/Performer",
    "Model",
    "Entrepreneur",
    "Corporate Professional",
    "Photographer/Videographer",
    "Journalist/Blogger",
    "Artist/Designer",
    "Public Speaker/Coach",
    "Fitness Trainer",
    "Healthcare Professional",
  ];

  // Education Options
  const educationOptions = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
  ];

  // Skills Options
  const skillsOptions = [
    "Content Creation",
    "Video Editing",
    "Photography",
    "Public Speaking",
    "Graphic Design",
    "Social Media Strategy",
    "Writing/Copywriting",
    "Brand Promotion",
    "SEO/Hashtag Strategy",
    "Storytelling",
    "Live Streaming",
    "Voice Over",
    "Community Engagement",
  ];

  // Age Range Options
  const ageRangeOptions = [
    "18-24",
    "25-30",
    "31-35",
    "36-40",
    "41-45",
    "46-50",
    "51+",
  ];

  useEffect(() => {
    // Load user profile data from API
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userToken = localStorage.getItem("usertoken");
      const clientToken = sessionStorage.getItem("clienttoken");
      const token = userToken || clientToken;
      if (!token) {
        console.error("No authentication token found");
        setMessage({
          type: "error",
          text: "Please login to access your profile",
        });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/user/profiles/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.userProfile) {
          setUserProfile(data.userProfile);
          setMessage({ type: "", text: "" }); // Clear any previous messages
        } else {
          console.log("No profile found, using empty form");
          setMessage({
            type: "info",
            text: "No profile found. You can create one by filling the form below.",
          });
        }
      } else if (response.status === 401) {
        console.error("Authentication failed");
        setMessage({
          type: "error",
          text: "Authentication failed. Please login again.",
        });
      } else if (response.status === 404) {
        console.log("No profile found, user can create one");
        setMessage({
          type: "info",
          text: "No profile found. You can create one by filling the form below.",
        });
      } else if (response.status === 500) {
        console.error("Server error occurred");
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text:
            errorData.message ||
            "Server error occurred. Please try again later.",
        });
      } else {
        console.error("Failed to load profile:", response.status);
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.message || "Failed to load profile",
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setMessage({
        type: "error",
        text: "Network error. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setTempProfile({ ...userProfile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempProfile({});
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const userToken = localStorage.getItem("usertoken");
      const clientToken = sessionStorage.getItem("clienttoken");
      const token = userToken || clientToken;
      if (!token) {
        console.error("No authentication token found");
        setMessage({
          type: "error",
          text: "Please login to save your profile",
        });
        return;
      }

      let response;
      if (userProfile._id) {
        // Update existing profile
        response = await fetch(
          `${API_BASE_URL}/api/auth/user/profiles/${userProfile._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(tempProfile),
          }
        );
      } else {
        // Create new profile
        response = await fetch(`${API_BASE_URL}/api/auth/user/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tempProfile),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserProfile(data.userProfile);
          setIsEditing(false);
          setTempProfile({});
          setMessage({ type: "success", text: "Profile saved successfully!" });
          // Reload the profile to get the updated data
          await loadUserProfile();
          // Clear message after 3 seconds
          setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } else {
          setMessage({
            type: "error",
            text: data.message || "Failed to save profile",
          });
        }
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.message || "Failed to save profile",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (isEditing) {
      setTempProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayChange = (field, value, action) => {
    if (isEditing) {
      setTempProfile((prev) => {
        const currentArray = prev[field] || [];
        let newArray;

        if (action === "add") {
          newArray = [...currentArray, value];
        } else if (action === "remove") {
          newArray = currentArray.filter((item) => item !== value);
        }

        return {
          ...prev,
          [field]: newArray,
        };
      });
    }
  };

  const handleSocialMediaChange = (platform, field, value) => {
    if (isEditing) {
      setTempProfile((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: {
            ...prev.socialMedia[platform],
            [field]: value,
          },
        },
      }));
    }
  };

  const renderField = (
    label,
    value,
    type = "text",
    options = null,
    fieldName = null
  ) => {
    const currentValue = isEditing
      ? tempProfile[fieldName || label.toLowerCase().replace(/\s+/g, "")]
      : value;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {isEditing ? (
          type === "select" ? (
            <select
              value={currentValue || ""}
              onChange={(e) =>
                handleInputChange(
                  fieldName || label.toLowerCase().replace(/\s+/g, ""),
                  e.target.value
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select {label}</option>
              {options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={currentValue || ""}
              onChange={(e) =>
                handleInputChange(
                  fieldName || label.toLowerCase().replace(/\s+/g, ""),
                  e.target.value
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[40px]">
            {currentValue || ""}
          </div>
        )}
      </div>
    );
  };

  const renderMultiSelect = (label, values, options, fieldName) => {
    const currentValues = isEditing ? tempProfile[fieldName] : values;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {isEditing ? (
          <div className="space-y-2">
            {options.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentValues?.includes(option) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleArrayChange(fieldName, option, "add");
                    } else {
                      handleArrayChange(fieldName, option, "remove");
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-md min-h-[40px]">
            {currentValues?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentValues.map((value, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {value}
                  </span>
                ))}
              </div>
            ) : (
              ""
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSocialMediaSection = () => {
    const socialPlatforms = [
      {
        key: "instagram",
        icon: <FaInstagram className="text-pink-500" />,
        label: "Instagram",
      },
      {
        key: "youtube",
        icon: <FaYoutube className="text-red-500" />,
        label: "YouTube",
      },
    ];

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaInstagram className="mr-2" />
          Social Media Profiles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialPlatforms.map((platform) => {
            const platformData = isEditing
              ? tempProfile.socialMedia?.[platform.key]
              : userProfile.socialMedia[platform.key];

            return (
              <div
                key={platform.key}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center mb-3">
                  {platform.icon}
                  <span className="ml-2 font-medium">{platform.label}</span>
                </div>

                {platform.key === "instagram" && (
                  <>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600">
                        Handle
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={platformData?.handle || ""}
                          onChange={(e) =>
                            handleSocialMediaChange(
                              platform.key,
                              "handle",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm">
                          {platformData?.handle || ""}
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600">
                        Followers
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={platformData?.followersCount || ""}
                          onChange={(e) =>
                            handleSocialMediaChange(
                              platform.key,
                              "followersCount",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm">
                          {platformData?.followersCount || ""}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {platform.key === "youtube" && (
                  <>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600">
                        Channel URL
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          value={platformData?.channelUrl || ""}
                          onChange={(e) =>
                            handleSocialMediaChange(
                              platform.key,
                              "channelUrl",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm">
                          {platformData?.channelUrl || ""}
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600">
                        Subscribers
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={platformData?.subscribers || ""}
                          onChange={(e) =>
                            handleSocialMediaChange(
                              platform.key,
                              "subscribers",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm">
                          {platformData?.subscribers || ""}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUser className="mr-3" />
          User Profile
        </h2>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
              >
                <FaSave className="mr-2" />
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : message.type === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : message.type === "info"
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUser className="mr-2" />
            Personal Information
          </h3>

          {renderField("Name", userProfile.name, "text", null, "name")}
          {renderField("Email", userProfile.email, "email", null, "email")}
          {renderField(
            "Mobile No",
            userProfile.mobileNumber,
            "tel",
            null,
            "mobileNumber"
          )}
          {renderField("City", userProfile.city, "text", null, "city")}
          {renderField(
            "Gender",
            userProfile.gender,
            "select",
            ["Male", "Female", "Other"],
            "gender"
          )}
          {renderField(
            "Age Range",
            userProfile.ageRange,
            "select",
            ageRangeOptions,
            "ageRange"
          )}
        </div>

        {/* Business & Professional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaBriefcase className="mr-2" />
            Business & Professional
          </h3>

          {renderMultiSelect(
            "Business Interests",
            userProfile.businessInterests,
            businessInterestsOptions,
            "businessInterests"
          )}
          {renderField(
            "Occupation",
            userProfile.occupation,
            "select",
            occupationOptions,
            "occupation"
          )}
        </div>
      </div>

      {/* Education & Skills */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaGraduationCap className="mr-2" />
            Education
          </h3>

          {renderField(
            "Highest Qualification",
            userProfile.highestQualification,
            "select",
            educationOptions,
            "highestQualification"
          )}
          {renderField(
            "Field of Study",
            userProfile.fieldOfStudy,
            "text",
            null,
            "fieldOfStudy"
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaTools className="mr-2" />
            Skills
          </h3>

          {renderMultiSelect(
            "Skills",
            userProfile.skills,
            skillsOptions,
            "skills"
          )}
        </div>
      </div>

      {/* Social Media Section */}
      {renderSocialMediaSection()}
    </div>
  );
};

export default UserTab;
