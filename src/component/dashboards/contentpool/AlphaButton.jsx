import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../../config';

const AlphaButton = ({ pool }) => {
  // Single instance for video generation
  const instanceId = 'video_generation';
  
  // Video generation state
  const [storiesById, setStoriesById] = useState({});
  const [isGeneratingAudioById, setIsGeneratingAudioById] = useState({});
  const [audiosById, setAudiosById] = useState({});
  const [isGeneratingPromptsById, setIsGeneratingPromptsById] = useState({});
  const [promptsById, setPromptsById] = useState({});
  const [isGeneratingVideoById, setIsGeneratingVideoById] = useState({});
  const [generatedVideoUrlById, setGeneratedVideoUrlById] = useState({});
  const [uploadedAudiosById, setUploadedAudiosById] = useState({});
  const [currentAudioPlayer, setCurrentAudioPlayer] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isGeneratingImageForPromptById, setIsGeneratingImageForPromptById] = useState({});
  const [generatedImagesForPromptsById, setGeneratedImagesForPromptsById] = useState({});
  const [editablePromptsById, setEditablePromptsById] = useState({});
  const [isGeneratingSRTById, setIsGeneratingSRTById] = useState({});
  const [generatedSRTById, setGeneratedSRTById] = useState({});
  const [isGeneratingDeepSRTById, setIsGeneratingDeepSRTById] = useState({});
  const [generatedDeepSRTById, setGeneratedDeepSRTById] = useState({});
  
  // Audio provider selection
  const [audioProviderById, setAudioProviderById] = useState({});
  const [isMenuOpenById, setIsMenuOpenById] = useState({});
  const [showElevenLabsVoicesById, setShowElevenLabsVoicesById] = useState({});
  const [playingVoice, setPlayingVoice] = useState(null);
  const [selectedVoiceById, setSelectedVoiceById] = useState({});
  const voiceOptions = [
    { name: 'kumaran', file: '/kumaran.mp3' },
    { name: 'monika', file: '/monika.mp3' },
    { name: 'aahir', file: '/aahir.mp3' },
    { name: 'kanika', file: '/kanika.mp3' },
  ];

  const elevenLabsVoiceIds = {
    kumaran: 'rgltZvTfiMmgWweZhh7n',
    monika: 'NaKPQmdr7mMxXuXrNeFC',
    aahir: 'RKshBIkZ7DwU6YNPq5Jd',
    kanika: 'xccfcojYYGnqTTxwZEDU',
  };

  const [showLmntVoicesById, setShowLmntVoicesById] = useState({});
  const [playingLmntVoice, setPlayingLmntVoice] = useState(null);
  const [selectedLmntVoiceById, setSelectedLmntVoiceById] = useState({});
  const lmntVoiceOptions = [
    { name: 'lucas', file: '/lucas.mp3' },
    { name: 'kennedy', file: '/kennedy.mp3' },
    { name: 'ryan', file: '/ryan.mp3' },
    { name: 'stella', file: '/stella.mp3' },
  ];

  // Image-to-video generation
  const [isGeneratingVideoForImageById, setIsGeneratingVideoForImageById] = useState({});
  const [generatedVideosForImagesById, setGeneratedVideosForImagesById] = useState({});

  // Video job tracking
  const [videoJobIds, setVideoJobIds] = useState({});
  const [videoJobProgress, setVideoJobProgress] = useState({});
  const [videoJobStatus, setVideoJobStatus] = useState({});

  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // Telegram sending state
  const [isSendingToTelegramById, setIsSendingToTelegramById] = useState({});
  
  // Save to pool state
  const [isSavingToPoolById, setIsSavingToPoolById] = useState({});
  
  // Audio extraction job tracking
  const [audioExtractionJobIds, setAudioExtractionJobIds] = useState({});
  const [audioExtractionProgress, setAudioExtractionProgress] = useState({});
  const [audioExtractionStatus, setAudioExtractionStatus] = useState({});
  const [extractedAudioUrls, setExtractedAudioUrls] = useState({});
  
  // Overlay font selection for subtitle overlays
  const [overlayFontById, setOverlayFontById] = useState({}); // { [instanceId]: 'notosans' | 'khand' | 'poppins' }
  const [isFontMenuOpenById, setIsFontMenuOpenById] = useState({}); // { [instanceId]: boolean }
  // Collapse control for first row (Story + Audio) per instance
  const [isFirstRowCollapsedById, setIsFirstRowCollapsedById] = useState({});
  // Tab selection for second row (SRT vs Image Prompts) per instance
  const [secondRowTabById, setSecondRowTabById] = useState({}); // { [instanceId]: 'srt' | 'images' }

  // Image preview handlers
  const handleImagePreview = (imageBase64) => {
    setPreviewImage(imageBase64);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImage(null);
  };

  // Send video to Telegram
  const handleSendToTelegram = async (instanceId) => {
    const videoUrl = generatedVideoUrlById[instanceId];
    if (!videoUrl) {
      alert('No video available to send');
      return;
    }

    setIsSendingToTelegramById(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      // Use default caption for generated video
      const caption = '🎥 AI Generated Video\n\nCreated with AI Studio';

      const response = await fetch(`${API_BASE_URL}/api/telegram/send-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: videoUrl,
          caption: caption
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send video: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Video sent to Telegram successfully!');
      } else {
        throw new Error(data.error || 'Failed to send video to Telegram');
      }
      
    } catch (error) {
      console.error('Error sending video to Telegram:', error);
      toast.error(`Failed to send video to Telegram: ${error.message}`);
    } finally {
      setIsSendingToTelegramById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Save video to pool
  const handleSaveToPool = async (instanceId) => {
    const videoUrl = generatedVideoUrlById[instanceId];
    if (!videoUrl) {
      alert('No video available to save');
      return;
    }

    if (!pool || !pool._id) {
      alert('No pool selected to save the video');
      return;
    }

    setIsSavingToPoolById(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      // Fetch the video blob from the URL
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', blob, `ai-generated-video-${Date.now()}.mp4`);

      // Upload to pool using the existing API
      const uploadResponse = await fetch(`${API_BASE_URL}/api/pools/${pool._id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save video: ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      
      if (data.success) {
        toast.success('Video saved to pool successfully!');
      } else {
        throw new Error(data.error || 'Failed to save video to pool');
      }
      
    } catch (error) {
      console.error('Error saving video to pool:', error);
      toast.error(`Failed to save video to pool: ${error.message}`);
    } finally {
      setIsSavingToPoolById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Audio generation function with provider selection
  const handleGenerateAudio = async (storyText, provider, instanceId) => {
    try {
      setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: true }));
      
      const apiEndpoint = provider === 'elevenlabs' 
        ? `${API_BASE_URL}/api/videocard/elevenlabs`
        : `${API_BASE_URL}/api/videocard/lmnt`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: storyText,
          format: 'base64'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio with ${provider}`);
      }

      const data = await response.json();
      
      if (data.success && data.audio) {
        setAudiosById(prev => ({ ...prev, [instanceId]: data.audio }));
      } else {
        throw new Error('No audio generated');
      }
      
    } catch (error) {
      console.error(`Error generating audio with ${provider}:`, error);
      alert(`Failed to generate audio with ${provider}. Please try again.`);
    } finally {
      setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Initialize with single instance
  useEffect(() => {
    setStoriesById({ [instanceId]: '' });
  }, []);


  

  // Prompt generation function
  const handleGeneratePrompts = async (storyText, instanceId) => {
    try {
      if (!generatedDeepSRTById[instanceId]) {
        alert('Please generate Deepgram SRT from the generated audio first, so prompts match sentence timing.');
        return;
      }
      setIsGeneratingPromptsById(prev => ({ ...prev, [instanceId]: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/videocard/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyScript: storyText,
          imageSrt: generatedDeepSRTById[instanceId]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to generate prompts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setPromptsById(prev => ({ ...prev, [instanceId]: data }));
      } else {
        console.error('Invalid response format:', data);
        throw new Error('No prompts generated - invalid response format');
      }
      
    } catch (error) {
      console.error('Error generating prompts:', error);
      alert('Failed to generate prompts. Please try again.');
    } finally {
      setIsGeneratingPromptsById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  const handleGenerateImageForPrompt = async (instanceId, promptIdx, promptText) => {
    setIsGeneratingImageForPromptById(prev => ({
      ...prev,
      [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: true }
    }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, aspect_ratio: '9:16', style: 'realistic', seed: '5' })
      });
      if (!response.ok) throw new Error('Failed to generate image');
      const data = await response.json();
      const base64 = data?.image || (Array.isArray(data?.images) ? data.images[0] : null);
      if (data.success && base64) {
        const src = typeof base64 === 'string' && base64.startsWith('data:')
          ? base64
          : `data:image/jpeg;base64,${base64}`;
        setGeneratedImagesForPromptsById(prev => ({
          ...prev,
          [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: src }
        }));
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      alert('Failed to generate image for prompt.');
    } finally {
      setIsGeneratingImageForPromptById(prev => ({
        ...prev,
        [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: false }
      }));
    }
  };


  // Image-to-video generation function
  const handleGenerateVideoForImage = async (instanceId, promptIdx, imageBase64, promptText) => {
    if (!imageBase64) {
      alert('Please generate an image first.');
      return;
    }

    setIsGeneratingVideoForImageById(prev => ({
      ...prev,
      [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: true }
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) ? imageBase64.split(',')[1] : imageBase64,
          prompt: promptText,
          duration: 5,
          model: "v3.5",
          motion_mode: "normal",
          quality: "360p"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to generate video: ${response.status} ${response.statusText} - ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.success && (data.videoUrl || data.video_generation)) {
        const videoUrl = data.videoUrl || data.video_generation?.Resp?.video_url || data.video_generation?.Resp?.url || null;
        
        setGeneratedVideosForImagesById(prev => ({
          ...prev,
          [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: { videoUrl: videoUrl, raw: data } }
        }));
      } else {
        throw new Error('No video URL returned');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to generate video for image. Please try again.');
    } finally {
      setIsGeneratingVideoForImageById(prev => ({
        ...prev,
        [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: false }
      }));
    }
  };

  // Video creation function - now using async endpoint
  const handleCreateVideo = async (instanceId) => {
    let audioToUse = audiosById[instanceId] || uploadedAudiosById[instanceId];
    if (!audioToUse) {
      alert('Please generate or upload audio first.');
      return;
    }
    
    // Check for generated images
    const images = [];
    const maxImages = (promptsById[instanceId]?.length) || 0;
    
    for (let idx = 0; idx < maxImages; idx++) {
      const generatedImg = (generatedImagesForPromptsById[instanceId] || {})[idx];
      if (generatedImg) {
        const base64Only = typeof generatedImg === 'string' && generatedImg.startsWith('data:')
          ? generatedImg.split(',')[1]
          : generatedImg;
        images.push({ image: base64Only });
      }
    }
    
    if (images.length === 0) {
      alert('Please generate at least one image for the video.');
      return;
    }

    // Use default card information for S3 organization
    const card = {
      name: 'AI Generated Video',
      category: 'AI Studio'
    };

    // Make story optional - if no story, create a simple generic one
    let storyText = storiesById[instanceId];
    if (!storyText) {
      storyText = 'This video presents educational content.';
    }

    // Make SRT optional - if no SRT, create a simple one
    let srtContent = generatedSRTById[instanceId];
    if (!srtContent) {
      // Try to get audio duration from the audio data
      let audioDuration = 30; // Default duration in seconds
      
      try {
        // Create a temporary audio element to get duration
        const audioBlob = new Blob([Uint8Array.from(atob(audioToUse), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Wait for audio to load and get duration
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            audioDuration = Math.ceil(audio.duration);
            URL.revokeObjectURL(audioUrl);
            resolve();
          });
          audio.addEventListener('error', () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          });
        });
      } catch (error) {
        console.warn('Could not determine audio duration, using default:', error);
      }
      
      srtContent = `1\n00:00:00,000 --> 00:00:${audioDuration},000\n${storyText || 'Video content'}`;
    }

    // Make Deepgram SRT optional - if no Deepgram SRT, use the regular SRT
    let deepSrtContent = generatedDeepSRTById[instanceId];
    if (!deepSrtContent) {
      deepSrtContent = srtContent;
    }

    setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: true }));
    setGeneratedVideoUrlById(prev => ({ ...prev, [instanceId]: null }));
    
    try {
      // Use async endpoint instead of synchronous
      const response = await fetch(`${API_BASE_URL}/api/videocard/generate-finalvideo-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioToUse,
          images,
          srt: srtContent,
          imageSrt: deepSrtContent,
          cardName: card.name,
          category: card.category,
          overlayFont: (overlayFontById[instanceId] || 'notosans'),
          storyScript: storyText,
          sentenceSrt: deepSrtContent,
          wordSrt: srtContent,
          imagePrompts: (promptsById[instanceId] || []).map(p => p.prompt)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start video generation: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.jobId) {
        // Start polling for job status
        pollJobStatus(instanceId, data.jobId);
        // Refresh card history after a short delay
        setTimeout(() => fetchCardJobs(card._id), 1000);
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (error) {
      console.error('Error starting video generation:', error);
      alert(`Failed to start video generation: ${error.message}`);
      setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Job status polling function
  const pollJobStatus = async (instanceId, jobId) => {
    setVideoJobIds(prev => ({ ...prev, [instanceId]: jobId }));
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/videocard/job-status/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.job) {
          const { status, progress, videoUrl, error } = data.job;
          
          setVideoJobStatus(prev => ({ ...prev, [instanceId]: status }));
          setVideoJobProgress(prev => ({ ...prev, [instanceId]: progress }));
          
          if (status === 'completed' && videoUrl) {
            // Video generation completed successfully
            setGeneratedVideoUrlById(prev => ({ ...prev, [instanceId]: videoUrl }));
            setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: false }));
            // Video generation completed
            clearInterval(pollInterval);
            alert('Video generated successfully!');
          } else if (status === 'failed') {
            // Video generation failed
            setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: false }));
            clearInterval(pollInterval);
            alert(`Video generation failed: ${error?.message || 'Unknown error'}`);
          }
          // Continue polling for 'pending' and 'processing' statuses
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: false }));
        clearInterval(pollInterval);
        alert('Failed to check video generation status. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 10 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (videoJobStatus[instanceId] === 'processing') {
        setIsGeneratingVideoById(prev => ({ ...prev, [instanceId]: false }));
        alert('Video generation is taking longer than expected. Please check back later.');
      }
    }, 10 * 60 * 1000); // 10 minutes
  };


  // Audio file upload handler
  const handleAudioUpload = (instanceId, event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, etc.)');
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        alert('File size must be less than 30MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Audio = e.target.result.split(',')[1];
        setUploadedAudiosById(prev => ({ ...prev, [instanceId]: base64Audio }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Video file upload handler for audio extraction
  const handleVideoUploadForAudioExtraction = async (instanceId, event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file (MP4, AVI, MOV, etc.)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('video', file);

      // Start async audio extraction
      const response = await fetch(`${API_BASE_URL}/api/audio/extract-async`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start audio extraction: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.jobId) {
        // Start polling for job status
        pollAudioExtractionStatus(instanceId, data.jobId);
        toast.success('Audio extraction started! This may take 30-60 seconds.');
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (error) {
      console.error('Error starting audio extraction:', error);
      toast.error(`Failed to start audio extraction: ${error.message}`);
    }
  };

  // Poll audio extraction job status
  const pollAudioExtractionStatus = async (instanceId, jobId) => {
    setAudioExtractionJobIds(prev => ({ ...prev, [instanceId]: jobId }));
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/audio/job-status/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.job) {
          const { status, progress, audioUrl, error } = data.job;
          
          setAudioExtractionStatus(prev => ({ ...prev, [instanceId]: status }));
          setAudioExtractionProgress(prev => ({ ...prev, [instanceId]: progress }));
          
          if (status === 'completed' && audioUrl) {
            // Audio extraction completed successfully
            setExtractedAudioUrls(prev => ({ ...prev, [instanceId]: audioUrl }));
            // Convert S3 URL to base64 for compatibility with existing audio handling
            try {
              const audioResponse = await fetch(audioUrl);
              const audioBlob = await audioResponse.blob();
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64Audio = e.target.result.split(',')[1];
                setUploadedAudiosById(prev => ({ ...prev, [instanceId]: base64Audio }));
              };
              reader.readAsDataURL(audioBlob);
            } catch (conversionError) {
              console.warn('Failed to convert audio URL to base64:', conversionError);
            }
            clearInterval(pollInterval);
            toast.success('Audio extracted successfully!');
          } else if (status === 'failed') {
            // Audio extraction failed
            clearInterval(pollInterval);
            toast.error(`Audio extraction failed: ${error?.message || 'Unknown error'}`);
          }
          // Continue polling for 'pending' and 'processing' statuses
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error polling audio extraction status:', error);
        clearInterval(pollInterval);
        toast.error('Failed to check audio extraction status. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
    
    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      if (audioExtractionStatus[instanceId] === 'processing') {
        toast.error('Audio extraction is taking longer than expected. Please check back later.');
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Audio playback function
  const handlePlayAudio = (audioBase64) => {
    try {
      if (currentAudioPlayer && isAudioPlaying) {
        currentAudioPlayer.pause();
        setIsAudioPlaying(false);
        setCurrentAudioPlayer(null);
        return;
      }
      if (currentAudioPlayer && !isAudioPlaying) {
        currentAudioPlayer.play();
        setIsAudioPlaying(true);
        return;
      }
      const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], {
        type: 'audio/mpeg'
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => {
        setIsAudioPlaying(false);
        setCurrentAudioPlayer(null);
      });
      audio.addEventListener('pause', () => {
        setIsAudioPlaying(false);
      });
      audio.addEventListener('play', () => {
        setIsAudioPlaying(true);
      });
      audio.play();
      setCurrentAudioPlayer(audio);
      setIsAudioPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio. Please try again.');
    }
  };

  const handleGenerateSRT = async (instanceId) => {
    const audioToUse = audiosById[instanceId] || uploadedAudiosById[instanceId];
    if (!audioToUse) {
      alert('Please generate or upload audio first.');
      return;
    }
    setIsGeneratingSRTById(prev => ({ ...prev, [instanceId]: true }));
    setGeneratedSRTById(prev => ({ ...prev, [instanceId]: "" }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/wordSRT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioToUse })
      });
      if (!response.ok) throw new Error('Failed to generate SRT');
      const data = await response.json();
      setGeneratedSRTById(prev => ({ ...prev, [instanceId]: data.srt || "" }));
    } catch (error) {
      alert('Failed to generate SRT. Please try again.');
    } finally {
      setIsGeneratingSRTById(prev => ({ ...prev, [instanceId]: false }));
    }
  };



  // Deepgram SRT generation function
  const handleGenerateDeepSRT = async (instanceId) => {
    const audioToUse = audiosById[instanceId] || uploadedAudiosById[instanceId];
    if (!audioToUse) {
      alert('Please generate or upload audio first.');
      return;
    }
    setIsGeneratingDeepSRTById(prev => ({ ...prev, [instanceId]: true }));
    setGeneratedDeepSRTById(prev => ({ ...prev, [instanceId]: "" }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/sentenceSRT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioToUse })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Deepgram API error:', errorData);
        throw new Error(errorData.error || `Failed to generate SRT from audio (${response.status})`);
      }
      
      // The backend returns SRT as plain text, not JSON
      const srtContent = await response.text();
      
      if (srtContent && srtContent.trim()) {
        setGeneratedDeepSRTById(prev => ({ ...prev, [instanceId]: srtContent }));
      } else {
        throw new Error('No SRT content received from server');
      }
    } catch (error) {
      console.error('Error generating SRT:', error);
      alert(`Failed to generate SRT from audio: ${error.message}`);
    } finally {
      setIsGeneratingDeepSRTById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Toggle font menu visibility (SRT for words section)
  const toggleFontMenu = (instanceId) => {
    setIsFontMenuOpenById(prev => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Handle overlay font selection
  const handleOverlayFontSelect = (fontKey, instanceId) => {
    setOverlayFontById(prev => ({ ...prev, [instanceId]: fontKey }));
    setIsFontMenuOpenById(prev => ({ ...prev, [instanceId]: false }));
  };

  // Toggle collapse for first row (Story + Audio)
  const toggleFirstRowCollapse = (instanceId) => {
    setIsFirstRowCollapsedById(prev => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Toggle menu visibility
  const toggleMenu = (instanceId) => {
    setIsMenuOpenById(prev => ({ ...prev, [instanceId]: !prev[instanceId] }));
  };

  // Handle provider selection
  const handleProviderSelect = (provider, instanceId) => {
    setAudioProviderById(prev => ({ ...prev, [instanceId]: provider }));
    setIsMenuOpenById(prev => ({ ...prev, [instanceId]: false }));
    if (provider === 'elevenlabs') {
      setShowElevenLabsVoicesById(prev => ({ ...prev, [instanceId]: true }));
      setShowLmntVoicesById(prev => ({ ...prev, [instanceId]: false }));
    } else if (provider === 'lmnt') {
      setShowLmntVoicesById(prev => ({ ...prev, [instanceId]: true }));
      setShowElevenLabsVoicesById(prev => ({ ...prev, [instanceId]: false }));
    } else {
      setShowElevenLabsVoicesById(prev => ({ ...prev, [instanceId]: false }));
      setShowLmntVoicesById(prev => ({ ...prev, [instanceId]: false }));
      if (storiesById[instanceId]) {
        handleGenerateAudio(storiesById[instanceId], provider, instanceId);
    }
    }
  };

  // Back button to return from voice selection to provider chooser
  const handleAudioBack = (instanceId) => {
    setShowElevenLabsVoicesById(prev => ({ ...prev, [instanceId]: false }));
    setShowLmntVoicesById(prev => ({ ...prev, [instanceId]: false }));
    setIsMenuOpenById(prev => ({ ...prev, [instanceId]: true }));
  };

  const handlePlayPauseVoice = (voice) => {
    if (playingVoice === voice) {
      document.getElementById(`audio-${voice}`).pause();
      setPlayingVoice(null);
    } else {
      if (playingVoice) {
        document.getElementById(`audio-${playingVoice}`).pause();
      }
      document.getElementById(`audio-${voice}`).play();
      setPlayingVoice(voice);
    }
  };

  const handlePlayPauseLmntVoice = (voice) => {
    if (playingLmntVoice === voice) {
      document.getElementById(`lmnt-audio-${voice}`).pause();
      setPlayingLmntVoice(null);
    } else {
      if (playingLmntVoice) {
        document.getElementById(`lmnt-audio-${playingLmntVoice}`).pause();
      }
      document.getElementById(`lmnt-audio-${voice}`).play();
      setPlayingLmntVoice(voice);
    }
  };

  const handleGenerateElevenLabsAudio = async (instanceId) => {
    const selectedVoice = selectedVoiceById[instanceId];
    if (!selectedVoice || !storiesById[instanceId]) return;
    setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/elevenlabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: storiesById[instanceId],
          voiceId: elevenLabsVoiceIds[selectedVoice],
          format: 'base64',
        }),
      });
      if (!response.ok) throw new Error('Failed to generate audio');
      const data = await response.json();
              if (data.success && data.audio) {
          setAudiosById(prev => ({ ...prev, [instanceId]: data.audio }));
          setShowElevenLabsVoicesById(prev => ({ ...prev, [instanceId]: false }));
        } else {
          throw new Error('No audio generated');
        }
    } catch (error) {
      alert('Failed to generate audio. Please try again.');
    } finally {
      setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  const handleGenerateLmntAudio = async (instanceId) => {
    const selectedLmntVoice = selectedLmntVoiceById[instanceId];
    if (!selectedLmntVoice || !storiesById[instanceId]) return;
    setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/lmnt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: storiesById[instanceId],
          voiceId: selectedLmntVoice,
          format: 'base64',
        }),
      });
      if (!response.ok) throw new Error('Failed to generate audio');
      const data = await response.json();
              if (data.success && data.audio) {
          setAudiosById(prev => ({ ...prev, [instanceId]: data.audio }));
          setShowLmntVoicesById(prev => ({ ...prev, [instanceId]: false }));
        } else {
          throw new Error('No audio generated');
        }
    } catch (error) {
      alert('Failed to generate audio. Please try again.');
    } finally {
      setIsGeneratingAudioById(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      


      {/* Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Image Preview</h3>
                <button
                  onClick={closeImagePreview}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                />
              </div>
              <div className="flex justify-end p-4 border-t border-gray-200">
                <button
                  onClick={closeImagePreview}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-full bg-white p-4">
          <div className="max-w-7xl mx-auto">
            <div className="p-0">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    AI Studio
                  </h3>
                  <p className="text-gray-600">Video Generation</p>
                </div>
              </div>

              {/* Video generation interface */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Question UI removed: app runs without question context */}

                 {/* Story and Audio Generation Row */}
                 <div className="mb-6 p-2 border border-gray-200 rounded-xl">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Story Generation Section */}
                    <div className="lg:w-3/5">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800">Step 1: Story Script</h3>
                        </div>
                      </div>
                      {!isFirstRowCollapsedById[instanceId] && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm h-[410px]">
                          <div className="mt-4">
                            <textarea
                              rows={12}
                              className="w-full rounded border border-green-200 bg-green-50 p-2 text-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 resize-y min-h-[70px]"
                              value={storiesById[instanceId] || ''}
                              onChange={e => setStoriesById(prev => ({ ...prev, [instanceId]: e.target.value }))}
                              placeholder="Write your story here..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Audio Generation Section */}
<div className="lg:w-2/5">
  <div className="flex items-center space-x-3 mb-4">
    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-blue-800">Step 2: Audio Generation</h3>
    
    </div>
    <button
      type="button"
      onClick={() => toggleFirstRowCollapse(instanceId)}
      className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
      title={isFirstRowCollapsedById[instanceId] ? 'Expand row' : 'Collapse row'}
    >
      {isFirstRowCollapsedById[instanceId] ? (
        <>
          Expand
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </>
      ) : (
        <>
          Collapse
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </>
      )}
    </button>
  </div>
  {!isFirstRowCollapsedById[instanceId] && (
  <>
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm h-102 relative" onClick={() => setIsMenuOpenById(prev => ({ ...prev, [instanceId]: false }))}>
    {showElevenLabsVoicesById[instanceId] ? (
      <div className="relative bg-white z-20 flex flex-col rounded-xl border border-blue-300 p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => handleAudioBack(instanceId)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h3 className="text-sm font-semibold text-blue-800">ElevenLabs Voices</h3>
        </div>
        <div className="overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* English Voices Column */}
            <div>
              <h4 className="text-xs font-semibold text-blue-800 mb-2 text-center">English Voices</h4>
              <div className="space-y-2">
                {voiceOptions.slice(0, 2).map((voice) => (
                  <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(selectedVoiceById[instanceId] || '') === voice.name}
                        onChange={() => setSelectedVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                        className="accent-blue-600 w-3 h-3"
                      />
                      <span className="font-medium text-blue-700 text-xs">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                      onClick={() => handlePlayPauseVoice(voice.name)}
                    >
                      {playingVoice === voice.name ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <audio
                      id={`audio-${voice.name}`}
                      src={voice.file}
                      onEnded={() => setPlayingVoice(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hindi Voices Column */}
            <div>
              <h4 className="text-xs font-semibold text-blue-800 mb-2 text-center">Hindi Voices</h4>
              <div className="space-y-2">
                {voiceOptions.slice(2, 4).map((voice) => (
                  <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(selectedVoiceById[instanceId] || '') === voice.name}
                        onChange={() => setSelectedVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                        className="accent-blue-600 w-3 h-3"
                      />
                      <span className="font-medium text-blue-700 text-xs">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                      onClick={() => handlePlayPauseVoice(voice.name)}
                    >
                      {playingVoice === voice.name ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <audio
                      id={`audio-${voice.name}`}
                      src={voice.file}
                      onEnded={() => setPlayingVoice(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <button
            className="w-full px-3 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!(selectedVoiceById[instanceId]) || isGeneratingAudioById[instanceId]}
            onClick={() => handleGenerateElevenLabsAudio(instanceId)}
          >
            {isGeneratingAudioById[instanceId] ? 'Generating...' : 'Generate Audio'}
          </button>
        </div>
      </div>
    ) : showLmntVoicesById[instanceId] ? (
      <div className="relative bg-white z-20 flex flex-col rounded-xl border border-blue-300 p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => handleAudioBack(instanceId)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h3 className="text-sm font-semibold text-blue-800">LMNT Voices</h3>
        </div>
        <div className="overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* English Voices Column */}
            <div>
              <h4 className="text-xs font-semibold text-blue-800 mb-2 text-center">English Voices</h4>
              <div className="space-y-2">
                {lmntVoiceOptions.slice(0, 2).map((voice) => (
                  <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(selectedLmntVoiceById[instanceId] || '') === voice.name}
                        onChange={() => setSelectedLmntVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                        className="accent-blue-600 w-3 h-3"
                      />
                      <span className="font-medium text-blue-700 text-xs">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                      onClick={() => handlePlayPauseLmntVoice(voice.name)}
                    >
                      {playingLmntVoice === voice.name ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <audio
                      id={`lmnt-audio-${voice.name}`}
                      src={voice.file}
                      onEnded={() => setPlayingLmntVoice(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hindi Voices Column */}
            <div>
              <h4 className="text-xs font-semibold text-blue-800 mb-2 text-center">Hindi Voices</h4>
              <div className="space-y-2">
                {lmntVoiceOptions.slice(2, 4).map((voice) => (
                  <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(selectedLmntVoiceById[instanceId] || '') === voice.name}
                        onChange={() => setSelectedLmntVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                        className="accent-blue-600 w-3 h-3"
                      />
                      <span className="font-medium text-blue-700 text-xs">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                      onClick={() => handlePlayPauseLmntVoice(voice.name)}
                    >
                      {playingLmntVoice === voice.name ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <audio
                      id={`lmnt-audio-${voice.name}`}
                      src={voice.file}
                      onEnded={() => setPlayingLmntVoice(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <button
            className="w-full px-3 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!(selectedLmntVoiceById[instanceId]) || isGeneratingAudioById[instanceId]}
            onClick={() => handleGenerateLmntAudio(instanceId)}
          >
            {isGeneratingAudioById[instanceId] ? 'Generating...' : 'Generate Audio'}
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-end mb-4">
          {/* Select Voices menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMenu(instanceId); }}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
            >
              Select Voices
            </button>
            {isMenuOpenById[instanceId] && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleProviderSelect('elevenlabs', instanceId); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  ElevenLabs
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleProviderSelect('lmnt', instanceId); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  LMNT
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => handleGenerateAudio(storiesById[instanceId] || '', (audioProviderById[instanceId] || 'elevenlabs'), instanceId)}
          disabled={isGeneratingAudioById[instanceId] || !storiesById[instanceId]}
          className={`w-full px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 ${
            isGeneratingAudioById[instanceId] || !storiesById[instanceId]
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
          }`}
        >
          {isGeneratingAudioById[instanceId] ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating Audio...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span>Generate Audio ({(audioProviderById[instanceId] || 'elevenlabs') === 'elevenlabs' ? 'ElevenLabs' : 'LMNT'})</span>
            </>
          )}
        </button>
        {!storiesById[instanceId] && (
          <div className="mt-2 text-xs text-blue-500">Write a story in the text area above or generate one to enable audio generation.</div>
        )}
        {audiosById[instanceId] && (
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center space-x-4">
              <button
                                  onClick={() => handlePlayAudio(audiosById[instanceId])}
                className="w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <span className="text-sm text-blue-700 font-medium">Generated Audio ({(audioProviderById[instanceId] || 'elevenlabs') === 'elevenlabs' ? 'ElevenLabs' : 'LMNT'})</span>
              <button
                onClick={() => {
                  const audioBlob = new Blob([Uint8Array.from(atob(audiosById[instanceId]), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = audioUrl;
                  downloadLink.download = `generated-audio-${(audioProviderById[instanceId] || 'elevenlabs')}.mp3`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }}
                className="ml-2 px-3 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Download
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 space-y-4">
          <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">Or upload your own audio (MP3, WAV, etc.):</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => handleAudioUpload(instanceId, e)}
            className="block w-full text-sm text-blue-700 border border-blue-200 rounded-lg cursor-pointer bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Or extract audio from video (MP4, AVI, MOV, etc.):</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoUploadForAudioExtraction(instanceId, e)}
              className="block w-full text-sm text-blue-700 border border-blue-200 rounded-lg cursor-pointer bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {audioExtractionStatus[instanceId] === 'processing' && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${audioExtractionProgress[instanceId] || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">
                    {audioExtractionProgress[instanceId] || 0}%
                  </span>
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  Extracting audio from video...
                </div>
              </div>
            )}
          </div>
          
          {uploadedAudiosById[instanceId] && !audiosById[instanceId] && (
            <div className="mt-2 bg-white rounded-lg p-4 shadow-sm border border-blue-100 flex items-center space-x-4">
              <button
                onClick={() => handlePlayAudio(uploadedAudiosById[instanceId])}
                className="w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <span className="text-sm text-blue-700 font-medium">
                {extractedAudioUrls[instanceId] ? 'Extracted Audio' : 'Uploaded Audio'}
              </span>
              <button
                onClick={() => {
                  const audioBlob = new Blob([Uint8Array.from(atob(uploadedAudiosById[instanceId]), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = audioUrl;
                  downloadLink.download = extractedAudioUrls[instanceId] ? 'extracted-audio.mp3' : 'uploaded-audio.mp3';
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }}
                className="ml-2 px-3 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </>
    )}
  </div>
  </>
  )}
</div>
                 </div>
                  </div>

                  {/* SRt for sentence and Image prompts */}
                  <div className="mb-6 p-2 border border-gray-200 rounded-xl">
                    {/* Tabs for Step 3/4 */}
                    <div className="mb-3">
                      <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSecondRowTabById(prev => ({ ...prev, [instanceId]: 'srt' }))}
                          className={`px-4 py-2 text-sm font-medium transition-colors border-r ${
                            (secondRowTabById[instanceId] || 'srt') === 'srt'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'text-gray-600 hover:bg-gray-50 border-gray-200'
                          }`}
                          title="SRT for sentences"
                        >
                          SRT for sentences
                        </button>
                        <button
                          type="button"
                          onClick={() => setSecondRowTabById(prev => ({ ...prev, [instanceId]: 'images' }))}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            (secondRowTabById[instanceId] || 'srt') === 'images'
                              ? 'bg-orange-50 text-orange-700 border-l border-orange-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title="Image Prompts"
                        >
                          Image Prompts
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 mt-6">
                    {/* SRT Generation for sentences Section (moved here) */}
                    <div className={(secondRowTabById[instanceId] || 'srt') === 'srt' ? '' : 'hidden'}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-teal-800">Step 3: SRT for sentences</h3>
                            
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 shadow-sm h-[600px]">
                        <div className="space-y-4">
                          
                          <button
                            onClick={() => handleGenerateDeepSRT(instanceId)}
                            disabled={isGeneratingDeepSRTById[instanceId] || !(audiosById[instanceId] || uploadedAudiosById[instanceId])}
                            className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 ${isGeneratingDeepSRTById[instanceId] ? 'bg-gray-400 cursor-not-allowed text-gray-600' : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105'}`}
                          >
                            {isGeneratingDeepSRTById[instanceId] ? (
                              <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating SRT from Generated Audio...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span>Generate </span>
                              </>
                            )}
                          </button>
                          {generatedDeepSRTById[instanceId] && (
                            <div className="mt-4 bg-white border border-teal-200 rounded p-4 overflow-y-auto max-h-180 h-100 text-xs font-mono whitespace-pre-wrap text-teal-800">
                              {generatedDeepSRTById[instanceId]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Image Prompts Section */}
                    <div className={(secondRowTabById[instanceId] || 'srt') === 'images' ? '' : 'hidden'}>
  <div className="flex items-center space-x-3 mb-3">
    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
      </svg>
    </div>
    <div>
      <h4 className="text-lg font-semibold text-orange-800">Step 4: Image Prompts</h4>

    </div>
  </div>
  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-sm h-[600px] flex flex-col">


    <button
      onClick={() => handleGeneratePrompts(storiesById[instanceId] || '', instanceId)}
      disabled={isGeneratingPromptsById[instanceId] || !storiesById[instanceId]}
      className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 ${
        isGeneratingPromptsById[instanceId] || !storiesById[instanceId]
          ? 'bg-gray-400 cursor-not-allowed text-gray-600'
          : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105'
      }`}
    >
      {isGeneratingPromptsById[instanceId] ? (
        <>
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
          <span>Generate Prompts</span>
        </>
      )}
    </button>
    {!storiesById[instanceId] && (
      <div className="mt-2 text-xs text-orange-500">Write a story in the text area above to enable prompt generation.</div>
    )}
    {promptsById[instanceId] && promptsById[instanceId].length > 0 && (
      <div className="mt-4 space-y-3 overflow-y-auto flex-1">
        {promptsById[instanceId].map((promptObj, idx) => (
          <div key={idx} className="flex items-start bg-white rounded-lg p-3 shadow-sm border border-orange-100 gap-3">
            <div className="w-full lg:w-1/2 xl:w-[55%]">
              <span className="font-medium text-orange-700">Prompt {promptObj.number || idx + 1}:</span>
              <textarea
                rows={8}
                className="mt-1 text-orange-600 leading-relaxed w-full rounded border border-orange-200 bg-orange-50 p-2 resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={(editablePromptsById[instanceId]||{})[idx] !== undefined ? (editablePromptsById[instanceId]||{})[idx] : promptObj.prompt}
                onChange={e => setEditablePromptsById(prev => ({ ...prev, [instanceId]: { ...(prev[instanceId]||{}), [idx]: e.target.value } }))}
              />
            </div>
            <div className="flex items-start gap-3 w-full lg:w-[45%] min-w-[360px]">
              <div className="flex flex-col gap-2">
                <button
                                  onClick={() => handleGenerateImageForPrompt(instanceId, idx, (editablePromptsById[instanceId]||{})[idx] !== undefined ? (editablePromptsById[instanceId]||{})[idx] : promptObj.prompt)}
                disabled={(isGeneratingImageForPromptById[instanceId]||{})[idx]}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1 ${(isGeneratingImageForPromptById[instanceId]||{})[idx] ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105'}`}
                >
                  {(isGeneratingImageForPromptById[instanceId]||{})[idx] ? (
                    <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>Generate</span>
                </button>
                

                
                {(generatedImagesForPromptsById[instanceId]||{})[idx] && (
                  <div className="relative">
                  <img
                    src={(generatedImagesForPromptsById[instanceId]||{})[idx]}
                      alt={`Image for prompt ${idx + 1}`}
                    className="w-32 h-48 md:w-40 md:h-64 object-contain rounded border border-amber-200 bg-amber-50 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleImagePreview((generatedImagesForPromptsById[instanceId]||{})[idx])}
                    title="Click to preview image"
                  />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {/* Generate Video Button */}
                <button
                                  onClick={() => handleGenerateVideoForImage(
                  instanceId,
                  idx, 
                  (generatedImagesForPromptsById[instanceId]||{})[idx], 
                  (editablePromptsById[instanceId]||{})[idx] !== undefined ? (editablePromptsById[instanceId]||{})[idx] : promptObj.prompt
                )}
                disabled={(isGeneratingVideoForImageById[instanceId]||{})[idx] || !(generatedImagesForPromptsById[instanceId]||{})[idx]}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-1 ${
                  (isGeneratingVideoForImageById[instanceId]||{})[idx] || !(generatedImagesForPromptsById[instanceId]||{})[idx]
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white hover:scale-105'
                  }`}
                >
                  {(isGeneratingVideoForImageById[instanceId]||{})[idx] ? (
                    <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  <span>Video</span>
                </button>
                
                {/* Display video generation status */}
                {(generatedVideosForImagesById[instanceId]||{})[idx]?.videoUrl ? (
                  <div className="w-40 md:w-56 relative z-10">
                    <video
                      controls
                      preload="metadata"
                      crossOrigin="anonymous"
                      className="w-full h-48 md:h-64 object-contain rounded border bg-black"
                                              src={generatedVideosForImagesById[instanceId][idx].videoUrl}
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          console.error('Video URL:', generatedVideosForImagesById[instanceId][idx].videoUrl);
                        }}
                    />
                  </div>
                ) : (generatedVideosForImagesById[instanceId]||{})[idx] ? (
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                    <div className="font-semibold">Video requested...</div>
                    <div className="text-xs opacity-75">Waiting for processing</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
                    </div>
                  </div>
                  </div>

                  {/* SRT Generation Row - SRT for words and SRT Generation for sentences */}
                  <div className="mb-6 p-2 border border-gray-200 rounded-xl">
                    <div className="mt-6 flex flex-col lg:flex-row gap-6">
                    {/* SRT for words Section */}
                    <div className="lg:w-1/2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-purple-800">Step 5: SRT for words</h3>
                          
                          </div>
                        </div>
                        {/* Font menu for subtitle overlays */}
                        <div className="relative">
                          <button
                            onClick={() => toggleFontMenu(instanceId)}
                            className="p-2 rounded-full hover:bg-purple-100 transition-colors duration-200"
                            title="Choose subtitle font"
                          >
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {isFontMenuOpenById[instanceId] && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <div className="px-3 py-2 text-xs text-gray-500">Subtitle font</div>
                              <button
                                onClick={() => handleOverlayFontSelect('notosans', instanceId)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                              >
                                NotoSans
                              </button>
                              <button
                                onClick={() => handleOverlayFontSelect('khand', instanceId)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                              >
                                Khand
                              </button>
                              <button
                                onClick={() => handleOverlayFontSelect('poppins', instanceId)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                              >
                                Poppins
                              </button>
                              <div className="px-3 py-2 text-[11px] text-gray-500 border-t">Selected: {(overlayFontById[instanceId] || 'notosans')}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-sm h-[600px]">
                        <button
                          onClick={() => handleGenerateSRT(instanceId)}
                          disabled={isGeneratingSRTById[instanceId] || !(audiosById[instanceId] || uploadedAudiosById[instanceId])}
                          className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 ${isGeneratingSRTById[instanceId] ? 'bg-gray-400 cursor-not-allowed text-gray-600' : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'}`}
                        >
                          {isGeneratingSRTById[instanceId] ? (
                            <>
                              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Generating SRT for words...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                              <span>Generate SRT for Words</span>
                            </>
                          )}
                        </button>
                        {generatedSRTById[instanceId] && (
                          <div className="mt-4 bg-white border border-purple-200 rounded p-4 overflow-y-auto max-h-110 text-xs font-mono whitespace-pre-wrap text-purple-900">
                            {generatedSRTById[instanceId]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Creation Section (moved here) */}
                    <div className="lg:w-1/2">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-red-800">Step 6: Video Creation</h4>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-sm h-[600px] mt-6">
                        <button
                          onClick={() => handleCreateVideo(instanceId)}
                          disabled={isGeneratingVideoById[instanceId]}
                          className="w-full px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isGeneratingVideoById[instanceId] ? (
                            <>
                              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>
                                {videoJobStatus[instanceId] === 'processing' 
                                  ? `Generating Video... ${videoJobProgress[instanceId] || 0}%`
                                  : 'Starting Video Generation...'
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                              </svg>
                              <span>Create Video</span>
                            </>
                          )}
                        </button>

                        {/* Progress bar for video generation */}
                        {isGeneratingVideoById[instanceId] && videoJobProgress[instanceId] > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${videoJobProgress[instanceId]}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1 text-center">
                              {videoJobStatus[instanceId] === 'processing' ? 'Processing...' : 'Initializing...'}
                            </div>
                          </div>
                        )}
                        
                
                        {generatedVideoUrlById[instanceId] && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-red-800 mb-2">Generated Video:</h4>
                            <div className="w-full max-w-[250px] mx-auto aspect-[9/16] bg-black rounded overflow-hidden flex items-center justify-center max-h-[750px]">
                              <video 
                                controls 
                                className="w-full h-full object-contain bg-black"
                                src={generatedVideoUrlById[instanceId]}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error('Video loading error:', e);
                                  console.error('Video URL:', generatedVideoUrlById[instanceId]);
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            
                            {/* Download and Telegram buttons for S3 videos */}
                            {generatedVideoUrlById[instanceId].startsWith('http') && (
                              <div className="mt-2 text-center space-y-2">
                                <div className="flex gap-2 justify-center">
                                  <a
                                    href={generatedVideoUrlById[instanceId]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Video
                                  </a>
                                  
                                  <button
                                    onClick={() => handleSendToTelegram(instanceId)}
                                    disabled={isSendingToTelegramById[instanceId]}
                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                      isSendingToTelegramById[instanceId]
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                  >
                                    {isSendingToTelegramById[instanceId] ? (
                                      <>
                                        <svg className="animate-spin w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send to Telegram
                                      </>
                                    )}
                                  </button>
                                  
                                  {/* <button
                                    onClick={() => handleSaveToPool(instanceId)}
                                    disabled={isSavingToPoolById[instanceId] || !pool}
                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                      isSavingToPoolById[instanceId] || !pool
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {isSavingToPoolById[instanceId] ? (
                                      <>
                                        <svg className="animate-spin w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        Save to Pool{pool?.name ? ` (${pool.name})` : ''}
                                      </>
                                    )}
                                  </button> */}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Telegram modal removed */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphaButton;