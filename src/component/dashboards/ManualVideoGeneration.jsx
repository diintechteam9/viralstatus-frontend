import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const ManualVideoGeneration = () => {
  // Single-session state (no question context)
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
  const [isGeneratingImageForPromptById, setIsGeneratingImageForPromptById] = useState({}); // { [instanceId]: { [idx]: bool } }
  const [generatedImagesForPromptsById, setGeneratedImagesForPromptsById] = useState({}); // { [instanceId]: { [idx]: base64 } }
  const [editablePromptsById, setEditablePromptsById] = useState({}); // { [instanceId]: { [idx]: string } }
  const [isGeneratingSRTById, setIsGeneratingSRTById] = useState({});
  const [generatedSRTById, setGeneratedSRTById] = useState({});
  const [isGeneratingDeepSRTById, setIsGeneratingDeepSRTById] = useState({});
  const [generatedDeepSRTById, setGeneratedDeepSRTById] = useState({});
  const [instances, setInstances] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isFullPageMode, setIsFullPageMode] = useState(false);
  
  // Video card form state
  const [showVideoCardForm, setShowVideoCardForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [videoCardForm, setVideoCardForm] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [videoCards, setVideoCards] = useState([]);
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  
  // New state for audio provider selection
  const [audioProviderById, setAudioProviderById] = useState({}); // default 'elevenlabs'
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
    { name: 'kennedy', file: '/kennedy.mp3' },
    { name: 'stella', file: '/stella.mp3' },
    { name: 'lucas', file: '/lucas.mp3' },
    { name: 'ryan', file: '/ryan.mp3' },
  ];

  // New state for image-to-video generation
  const [isGeneratingVideoForImageById, setIsGeneratingVideoForImageById] = useState({}); // { [instanceId]: { [idx]: bool } }
  const [generatedVideosForImagesById, setGeneratedVideosForImagesById] = useState({}); // { [instanceId]: { [idx]: {videoUrl, raw} } }

  // Video job tracking
  const [videoJobIds, setVideoJobIds] = useState({}); // { [instanceId]: jobId }
  const [videoJobProgress, setVideoJobProgress] = useState({}); // { [instanceId]: progress }
  const [videoJobStatus, setVideoJobStatus] = useState({}); // { [instanceId]: status }



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

  // Handle card selection and full page mode
  const handleCardClick = (instanceId) => {
    setSelectedId(instanceId);
    setIsFullPageMode(true);
  };

  // Handle back button click
  const handleBackClick = () => {
    setIsFullPageMode(false);
    setSelectedId(null);
  };

  // Video card functions
  const handleVideoCardFormSubmit = async (e) => {
    e.preventDefault();
    if (!videoCardForm.name || !videoCardForm.description || !videoCardForm.category) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmittingCard(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/videocard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoCardForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create video card');
      }

      const newCard = await response.json();
      setVideoCards(prev => [newCard, ...prev]);
      
      // Add the new card to instances and make it selectable
      const newInstanceId = `card_${newCard._id}`;
      setInstances(prev => [...prev, newInstanceId]);
      
      setVideoCardForm({ name: '', description: '', category: '' });
      setShowVideoCardForm(false);
      alert('Video card created successfully!');
    } catch (error) {
      console.error('Error creating video card:', error);
      alert('Failed to create video card. Please try again.');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  const fetchVideoCards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/videocard`);
      if (response.ok) {
        const cards = await response.json();
        setVideoCards(cards);
        
        // Add existing cards to instances
        const cardInstances = cards.map(card => `card_${card._id}`);
        setInstances(cardInstances);
      }
    } catch (error) {
      console.error('Error fetching video cards:', error);
    }
  };

  const deleteVideoCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this video card?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/videocard/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVideoCards(prev => prev.filter(card => card._id !== cardId));
        
        // Remove from instances
        const instanceIdToRemove = `card_${cardId}`;
        setInstances(prev => prev.filter(id => id !== instanceIdToRemove));
        
        // If the deleted card was selected, select another card or set to null
        if (selectedId === instanceIdToRemove) {
          const remainingInstances = instances.filter(id => id !== instanceIdToRemove);
          setSelectedId(remainingInstances.length > 0 ? remainingInstances[0] : null);
        }
        
        alert('Video card deleted successfully!');
      } else {
        throw new Error('Failed to delete video card');
      }
    } catch (error) {
      console.error('Error deleting video card:', error);
      alert('Failed to delete video card. Please try again.');
    }
  };

  const editVideoCard = (card) => {
    setVideoCardForm({
      name: card.name,
      description: card.description,
      category: card.category
    });
    setEditingCardId(card._id);
    setShowEditForm(true);
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!videoCardForm.name || !videoCardForm.description || !videoCardForm.category) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmittingCard(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/videocard/videocard/${editingCardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoCardForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update video card');
      }

      const updatedCard = await response.json();
      setVideoCards(prev => prev.map(card => 
        card._id === editingCardId ? updatedCard : card
      ));
      setVideoCardForm({ name: '', description: '', category: '' });
      setShowEditForm(false);
      setEditingCardId(null);
      alert('Video card updated successfully!');
    } catch (error) {
      console.error('Error updating video card:', error);
      alert('Failed to update video card. Please try again.');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  // Load video cards on component mount
  useEffect(() => {
    fetchVideoCards();
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
        body: JSON.stringify({ prompt: promptText })
      });
      if (!response.ok) throw new Error('Failed to generate image');
      const data = await response.json();
      if (data.image) {
        setGeneratedImagesForPromptsById(prev => ({
          ...prev,
          [instanceId]: { ...(prev[instanceId]||{}), [promptIdx]: data.image }
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
          image_base64: imageBase64,
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
      if (generatedImg) images.push({ image: generatedImg });
    }
    
    if (images.length === 0) {
      alert('Please generate at least one image for the video.');
      return;
    }

    // Get card information for S3 organization
    const cardId = instanceId.replace('card_', '');
    const card = videoCards.find(c => c._id === cardId);
    if (!card) {
      alert('Card information not found. Please refresh and try again.');
      return;
    }

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
          category: card.category
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
      

      {/* Video Card Form Modal */}
      {showVideoCardForm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Video Card</h3>
              <button
                onClick={() => setShowVideoCardForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleVideoCardFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={videoCardForm.name}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter video card name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={videoCardForm.description}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter video card description"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={videoCardForm.category}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVideoCardForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCard}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmittingCard ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Card Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Video Card</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingCardId(null);
                  setVideoCardForm({ name: '', description: '', category: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={videoCardForm.name}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter video card name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={videoCardForm.description}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter video card description"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={videoCardForm.category}
                  onChange={(e) => setVideoCardForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingCardId(null);
                    setVideoCardForm({ name: '', description: '', category: '' });
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCard}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmittingCard ? 'Updating...' : 'Update Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-full bg-white p-4">
          <div className="max-w-7xl mx-auto">
            <div className="p-0">
              {!isFullPageMode ? (
                <>
              <div className="mb-6 flex items-start justify-between">
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  AI Studio
                </h3>
                  <p className="text-gray-600 max-w-md">
                  Generate stories, audio, and prompts for your questions to enhance learning experience.
                </p>
                </div>
                <button
                  type="button"
                      onClick={() => setShowVideoCardForm(true)}
                      title="Create new video card"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

                  <div className="space-y-4 mb-6">
                {instances.map((instanceId) => {
                  const cardId = instanceId.replace('card_', '');
                  const card = videoCards.find(c => c._id === cardId);
                  return (
                    <div key={instanceId} className="relative group">
                      <div className="w-full p-6 rounded-lg border transition-all duration-200 hover:shadow-md bg-white text-gray-800 border-gray-300 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleCardClick(instanceId)}
                          >
                            <h4 className="font-semibold text-lg text-gray-800">
                              {card ? card.name : 'Loading...'}
                            </h4>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editVideoCard(card);
                              }}
                              className="p-2 rounded hover:bg-opacity-20 transition-colors text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit card"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVideoCard(card._id);
                              }}
                              className="p-2 rounded hover:bg-opacity-20 transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete card"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {card && (
                          <div 
                            className="cursor-pointer"
                            onClick={() => handleCardClick(instanceId)}
                          >
                            <p className="text-sm mb-4 leading-relaxed text-gray-600">
                              {card.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {card.category}
                              </span>
                              <span className="text-sm text-gray-500">
                                Created: {new Date(card.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </div>

                  {instances.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Video Cards Yet</h3>
                      <p className="text-gray-600 mb-6">Create a video card using the + button above to start working on your project.</p>
                      <button
                        onClick={() => setShowVideoCardForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Video Card
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Full page mode - show selected card's interface
                <div className="h-full">
                  {/* Back button and header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleBackClick}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Cards
                      </button>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {(() => {
                            const cardId = selectedId?.replace('card_', '');
                            const card = videoCards.find(c => c._id === cardId);
                            return card ? card.name : 'Video Project';
                          })()}
                        </h3>
                        <p className="text-gray-600">AI Studio - Video Generation</p>
                      </div>
                    </div>
                  </div>

                  {/* Video generation interface */}
                  {selectedId && instances.length > 0 ? (
                instances.map((instanceId, instanceIdx) => (
                (selectedId === instanceId) ? (
                  <div key={instanceId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Question UI removed: app runs without question context */}

                  {/* Story and Audio Generation Row */}
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Story Generation Section */}
                    <div className="lg:w-3/5">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm h-[410px]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-green-800">Step 1: Story Generation</h3>
                              <p className="text-sm text-green-600">Write your own story or generate one based on your question</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Story generation and language selection removed */}
                          </div>
                        </div>
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
                    </div>

                  {/* Audio Generation Section */}
<div className="lg:w-2/5">
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm h-full relative">
    {showElevenLabsVoicesById[instanceId] ? (
      <div className="relative bg-white z-20 flex flex-col justify-between rounded-xl border border-blue-300 p-6 h-full">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => handleAudioBack(instanceId)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <div>
          <h3 className="text-base font-semibold text-blue-800 mb-3">Select a Voice (ElevenLabs)</h3>
          <div className="grid grid-cols-1 gap-2">
            {voiceOptions.map((voice) => (
              <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(selectedVoiceById[instanceId] || '') === voice.name}
                    onChange={() => setSelectedVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="font-medium text-blue-700 text-sm">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                    onClick={() => handlePlayPauseVoice(voice.name)}
                  >
                    {playingVoice === voice.name ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <button
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!(selectedVoiceById[instanceId]) || isGeneratingAudioById[instanceId]}
            onClick={() => handleGenerateElevenLabsAudio(instanceId)}
          >
            {isGeneratingAudioById[instanceId] ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    ) : showLmntVoicesById[instanceId] ? (
      <div className="relative bg-white z-20 flex flex-col justify-between rounded-xl border border-blue-300 p-6 h-full">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => handleAudioBack(instanceId)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <div>
          <h3 className="text-base font-semibold text-blue-800 mb-3">Select a Voice (LMNT)</h3>
          <div className="grid grid-cols-1 gap-2">
            {lmntVoiceOptions.map((voice) => (
              <div key={voice.name} className="flex items-center justify-between border border-blue-100 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(selectedLmntVoiceById[instanceId] || '') === voice.name}
                    onChange={() => setSelectedLmntVoiceById(prev => ({ ...prev, [instanceId]: voice.name }))}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="font-medium text-blue-700 text-sm">{voice.name.charAt(0).toUpperCase() + voice.name.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full flex items-center justify-center transition-colors duration-200"
                    onClick={() => handlePlayPauseLmntVoice(voice.name)}
                  >
                    {playingLmntVoice === voice.name ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <button
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!(selectedLmntVoiceById[instanceId]) || isGeneratingAudioById[instanceId]}
            onClick={() => handleGenerateLmntAudio(instanceId)}
          >
            {isGeneratingAudioById[instanceId] ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Step 2: Audio Generation</h3>
              <p className="text-sm text-blue-600">Convert story to speech</p>
            </div>
          </div>
          {/* Three-dot menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu(instanceId)}
              className="p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {isMenuOpenById[instanceId] && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleProviderSelect('elevenlabs', instanceId)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  ElevenLabs
                </button>
                <button
                  onClick={() => handleProviderSelect('lmnt', instanceId)}
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
        <div className="mt-4">
          <label className="block text-sm font-medium text-blue-700 mb-2">Or upload your own audio (MP3, WAV, etc.):</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => handleAudioUpload(instanceId, e)}
            className="block w-full text-sm text-blue-700 border border-blue-200 rounded-lg cursor-pointer bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
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
              <span className="text-sm text-blue-700 font-medium">Uploaded Audio</span>
              <button
                onClick={() => {
                  const audioBlob = new Blob([Uint8Array.from(atob(uploadedAudiosById[instanceId]), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = audioUrl;
                  downloadLink.download = 'uploaded-audio.mp3';
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
</div>
                  </div>

                  {/* Image Prompts and Video Creation Row */}
                  <div className="flex flex-col lg:flex-row gap-6 mt-6">
                    {/* SRT Generation for sentences Section (moved here) */}
                    <div className="lg:w-3/5">
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 shadow-sm h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-teal-800">Step 3: SRT Generation for sentences</h3>
                              <p className="text-sm text-teal-600">Generate sentence-level subtitles</p>
                            </div>
                          </div>
                        </div>
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
                                <span>Generate SRT from Generated Audio</span>
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
                    <div className="lg:w-2/5">
  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-sm h-[600px] flex flex-col">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-orange-800">Step 4: Image Prompts</h4>
        <p className="text-xs text-orange-600">Generate images for your prompts</p>
      </div>
    </div>


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
            <div className="flex-1">
              <span className="font-medium text-orange-700">Prompt {promptObj.number || idx + 1}:</span>
              <textarea
                rows={4}
                className="mt-1 text-orange-600 leading-relaxed w-full rounded border border-orange-200 bg-orange-50 p-2 resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={(editablePromptsById[instanceId]||{})[idx] !== undefined ? (editablePromptsById[instanceId]||{})[idx] : promptObj.prompt}
                onChange={e => setEditablePromptsById(prev => ({ ...prev, [instanceId]: { ...(prev[instanceId]||{}), [idx]: e.target.value } }))}
              />
            </div>
            <div className="flex items-start gap-3 min-w-[260px]">
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
                    src={`data:image/jpeg;base64,${(generatedImagesForPromptsById[instanceId]||{})[idx]}`}
                      alt={`Image for prompt ${idx + 1}`}
                    className="w-24 h-32 object-contain rounded border border-amber-200 bg-amber-50"
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
                  <div className="w-28 relative z-10">
                    <video
                      controls
                      preload="metadata"
                      crossOrigin="anonymous"
                      className="w-full h-32 object-contain rounded border bg-black"
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

                  {/* SRT Generation Row - SRT for words and SRT Generation for sentences */}
                  <div className="mt-6 flex flex-col lg:flex-row gap-6">
                    {/* SRT for words Section */}
                    <div className="lg:w-1/2">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-sm h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-purple-800">Step 5: SRT for words</h3>
                              <p className="text-sm text-purple-600">Generate word-level subtitles</p>
                            </div>
                          </div>
                        </div>
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
                          <div className="mt-4 bg-white border border-purple-200 rounded p-4 overflow-y-auto max-h-180 text-xs font-mono whitespace-pre-wrap text-purple-900">
                            {generatedSRTById[instanceId]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Creation Section (moved here) */}
                    <div className="lg:w-1/2">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-sm h-[600px]">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-red-800">Step 6: Video Creation</h4>
                          </div>
                        </div>
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
                            
                            {/* Download button for S3 videos */}
                            {generatedVideoUrlById[instanceId].startsWith('http') && (
                              <div className="mt-2 text-center">
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
                              </div>
                            )}
                          </div>
                        )}

                        {/* Telegram modal removed */}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                        </svg>
            </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Video Cards Available</h3>
                      <p className="text-gray-600 mb-6">Please go back and create a video card first.</p>
          </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualVideoGeneration;