export async function mergeMediaFiles(mediaFiles, musicFiles, canvasSize, selectedTransition, progressCallback, options = {}) {
  try {
    console.log('mergeMediaFiles called with options:', options);
    console.log('showInrow value:', options.showInrow);
    console.log('showOutrow value:', options.showOutrow);

    if (!mediaFiles || mediaFiles.length === 0) {
      throw new Error("No media files to merge");
    }

    progressCallback(5);

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Set canvas dimensions based on selected size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Load logo if enabled
    let logoImage = null;
    if (options.showLogo) {
      console.log('Loading logo image...');
      logoImage = new Image();
      logoImage.src = '/src/assets/logo/logo.jpg';
      await new Promise((resolve, reject) => {
        logoImage.onload = resolve;
        logoImage.onerror = reject;
      });
    }

    // Load inrow if enabled
    let inrowImage = null;
    if (options.showInrow) {
      console.log('Loading inrow image...');
      inrowImage = new Image();
      inrowImage.src = '/src/assets/inrow/inrow.png';
      console.log('Attempting to load inrow image from:', inrowImage.src);
      
      try {
        await new Promise((resolve, reject) => {
          inrowImage.onload = () => {
            console.log('Inrow image loaded successfully, dimensions:', inrowImage.width, 'x', inrowImage.height);
            resolve();
          };
          inrowImage.onerror = (error) => {
            console.error('Error loading inrow image:', error);
            console.error('Failed to load image from:', inrowImage.src);
            reject(error);
          };
        });
      } catch (error) {
        console.error('Failed to load inrow image:', error);
        inrowImage = null;
      }
    }

    // Load outrow if enabled
    let outrowImage = null;
    if (options.showOutrow) {
      console.log('Loading outrow image...');
      outrowImage = new Image();
      outrowImage.src = '/src/assets/outrow/outrow.png';
      console.log('Attempting to load outrow image from:', outrowImage.src);
      
      try {
        await new Promise((resolve, reject) => {
          outrowImage.onload = () => {
            console.log('Outrow image loaded successfully, dimensions:', outrowImage.width, 'x', outrowImage.height);
            resolve();
          };
          outrowImage.onerror = (error) => {
            console.error('Error loading outrow image:', error);
            console.error('Failed to load image from:', outrowImage.src);
            reject(error);
          };
        });
      } catch (error) {
        console.error('Failed to load outrow image:', error);
        outrowImage = null;
      }
    }

    // Process each media file with proper timing
    const mediaElements = [];
    
    // First, add all regular media files
    for (let i = 0; i < mediaFiles.length; i++) {
      const media = mediaFiles[i];
      const element = await createMediaElement(media, canvas);
      if (element) {
        mediaElements.push(element);
      }
      progressCallback(5 + (i / mediaFiles.length) * 70);
    }

    if (mediaElements.length === 0) {
      throw new Error("No valid media elements to merge");
    }

    // Create final array with proper order: inrow -> media files -> outrow
    const finalMediaElements = [];

    // Add inrow as first element if enabled
    if (options.showInrow && inrowImage) {
      console.log('Adding inrow element as first element...');
      const inrowElement = {
        type: 'image',
        element: inrowImage,
        duration: 2000, // Fixed 2 seconds for inrow
        width: canvas.width,
        height: canvas.height,
        trimmed: true,
        trimStart: 0,
        trimEnd: 2
      };
      finalMediaElements.push(inrowElement);
      console.log('Inrow element added as first element');
    } else if (options.showInrow) {
      console.error('Inrow option is enabled but image failed to load');
    }

    // Add all regular media files
    finalMediaElements.push(...mediaElements);

    // Add outrow as last element if enabled
    if (options.showOutrow && outrowImage) {
      console.log('Adding outrow element as last element...');
      const outrowElement = {
        type: 'image',
        element: outrowImage,
        duration: 2000, // Fixed 2 seconds for outrow
        width: canvas.width,
        height: canvas.height,
        trimmed: true,
        trimStart: 0,
        trimEnd: 2
      };
      finalMediaElements.push(outrowElement);
      console.log('Outrow element added as last element');
    } else if (options.showOutrow) {
      console.error('Outrow option is enabled but image failed to load');
    }

    console.log('Final media elements order:', finalMediaElements.map(e => e.type));

    // Create final video with audio
    const outputBlob = await recordMediaElements(finalMediaElements, canvas, musicFiles, selectedTransition, progressCallback, {
      logoImage,
      logoPosition: options.logoPosition
    });
    progressCallback(95);

    const mergedUrl = URL.createObjectURL(outputBlob);
    progressCallback(100);
    return mergedUrl;
  } catch (error) {
    console.error('Error merging media:', error);
    throw error;
  }
}

export async function mergeMediaFilesManual(mediaFiles, musicFiles, canvasSize, selectedTransition, progressCallback, options = {}) {
  try {
    console.log('mergeMediaFilesManual called with options:', options);
    console.log('showInrow value:', options.showInrow);
    console.log('showOutrow value:', options.showOutrow);

    if (!mediaFiles || mediaFiles.length === 0) {
      throw new Error("No media files to merge");
    }

    progressCallback(5);

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Set canvas dimensions based on selected size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Load logo if enabled
    let logoImage = null;
    if (options.showLogo) {
      console.log('Loading logo image...');
      logoImage = new Image();
      logoImage.src = '/src/assets/logo/logo.jpg';
      await new Promise((resolve, reject) => {
        logoImage.onload = resolve;
        logoImage.onerror = reject;
      });
    }

    // Load inrow if enabled
    let inrowImage = null;
    if (options.showInrow) {
      console.log('Loading inrow image...');
      inrowImage = new Image();
      inrowImage.src = '/src/assets/inrow/inrow.png';
      console.log('Attempting to load inrow image from:', inrowImage.src);
      
      try {
        await new Promise((resolve, reject) => {
          inrowImage.onload = () => {
            console.log('Inrow image loaded successfully, dimensions:', inrowImage.width, 'x', inrowImage.height);
            resolve();
          };
          inrowImage.onerror = (error) => {
            console.error('Error loading inrow image:', error);
            console.error('Failed to load image from:', inrowImage.src);
            reject(error);
          };
        });
      } catch (error) {
        console.error('Failed to load inrow image:', error);
        inrowImage = null;
      }
    }

    // Load outrow if enabled
    let outrowImage = null;
    if (options.showOutrow) {
      console.log('Loading outrow image...');
      outrowImage = new Image();
      outrowImage.src = '/src/assets/outrow/outrow.png';
      console.log('Attempting to load outrow image from:', outrowImage.src);
      
      try {
        await new Promise((resolve, reject) => {
          outrowImage.onload = () => {
            console.log('Outrow image loaded successfully, dimensions:', outrowImage.width, 'x', outrowImage.height);
            resolve();
          };
          outrowImage.onerror = (error) => {
            console.error('Error loading outrow image:', error);
            console.error('Failed to load image from:', outrowImage.src);
            reject(error);
          };
        });
      } catch (error) {
        console.error('Failed to load outrow image:', error);
        outrowImage = null;
      }
    }

    // Process each media file with proper timing
    const mediaElements = [];
    
    // First, add all regular media files
    for (let i = 0; i < mediaFiles.length; i++) {
      const media = mediaFiles[i];
      const element = await createMediaElement(media, canvas);
      if (element) {
        mediaElements.push(element);
      }
      progressCallback(5 + (i / mediaFiles.length) * 70);
    }

    if (mediaElements.length === 0) {
      throw new Error("No valid media elements to merge");
    }

    // Create final array with proper order: inrow -> media files -> outrow
    const finalMediaElements = [];

    // Add inrow as first element if enabled
    if (options.showInrow && inrowImage) {
      console.log('Adding inrow element as first element...');
      const inrowElement = {
        type: 'image',
        element: inrowImage,
        duration: 2000, // Fixed 2 seconds for inrow
        width: canvas.width,
        height: canvas.height,
        trimmed: true,
        trimStart: 0,
        trimEnd: 2
      };
      finalMediaElements.push(inrowElement);
      console.log('Inrow element added as first element');
    } else if (options.showInrow) {
      console.error('Inrow option is enabled but image failed to load');
    }

    // Add all regular media files
    finalMediaElements.push(...mediaElements);

    // Add outrow as last element if enabled
    if (options.showOutrow && outrowImage) {
      console.log('Adding outrow element as last element...');
      const outrowElement = {
        type: 'image',
        element: outrowImage,
        duration: 2000, // Fixed 2 seconds for outrow
        width: canvas.width,
        height: canvas.height,
        trimmed: true,
        trimStart: 0,
        trimEnd: 2
      };
      finalMediaElements.push(outrowElement);
      console.log('Outrow element added as last element');
    } else if (options.showOutrow) {
      console.error('Outrow option is enabled but image failed to load');
    }

    console.log('Final media elements order:', finalMediaElements.map(e => e.type));

    // Create final video with audio
    const outputBlob = await recordMediaElementsManual(finalMediaElements, canvas, musicFiles, selectedTransition, progressCallback, {
      logoImage,
      logoPosition: options.logoPosition
    });
    progressCallback(95);

    const mergedUrl = URL.createObjectURL(outputBlob);
    progressCallback(100);
    return mergedUrl;
  } catch (error) {
    console.error('Error merging media:', error);
    throw error;
  }
}

async function getMediaDimensions(media) {
  return new Promise((resolve) => {
    if (media.type === 'video') {
      const video = document.createElement('video');
      video.src = media.url;
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
        video.remove();
      };
      video.onerror = () => resolve({ width: 0, height: 0 });
    } else {
      const img = new Image();
      img.src = media.url;
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve({ width: 0, height: 0 });
    }
  });
}

async function createMediaElement(media, canvas) {
  if (media.type === 'video') {
    return await createVideoElement(media, canvas);
  } else {
    return await createImageElement(media, canvas);
  }
}

function createVideoElement(videoMedia) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoMedia.url;
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      resolve({
        type: 'video',
        element: video,
        duration: videoMedia.trimmed ? (videoMedia.trimEnd - videoMedia.trimStart) * 1000 : video.duration * 1000,
        width: video.videoWidth,
        height: video.videoHeight,
        trimStart: videoMedia.trimStart || 0,
        trimEnd: videoMedia.trimEnd || video.duration
      });
    };
    
    video.onerror = () => resolve(null);
  });
}

function createImageElement(imageMedia) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageMedia.url;
    
    img.onload = () => {
      // Use trimmed duration if available, otherwise default to 5 seconds
      const duration = imageMedia.trimmed 
        ? (imageMedia.trimEnd - imageMedia.trimStart) * 1000 // convert to ms
        : 5000; // default 5 seconds for images
      
      resolve({
        type: 'image',
        element: img,
        duration: duration,
        width: img.width,
        height: img.height,
        trimStart: imageMedia.trimStart || 0,
        trimEnd: imageMedia.trimEnd || 5
      });
    };
    
    img.onerror = () => resolve(null);
  });
}

async function recordMediaElements(mediaElements, canvas, musicFiles, selectedTransition, progressCallback, options = {}) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream();
    
    // Add audio tracks if available
    if (musicFiles && musicFiles.length > 0) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Calculate total duration including inrow and outrow
      const totalDuration = mediaElements.reduce((sum, element) => sum + element.duration, 0);
      
      // Create and prepare all audio elements first
      const audioElements = musicFiles.map(music => {
        const audio = new Audio(music.url);
        const source = audioContext.createMediaElementSource(audio);
        source.connect(audioDestination);
        
        // Set exact duration for music to match total video duration
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime >= totalDuration / 1000) { // Convert ms to seconds
            audio.pause();
          }
        });
        
        return audio;
      });

      // Add audio tracks to the stream
      audioDestination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });

      // Start all audio elements when recording starts
      const startAudio = () => {
        // Start audio before any media elements
        audioElements.forEach(audio => {
          audio.currentTime = 0;
          audio.play().catch(e => console.error("Audio play error:", e));
        });
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        // Stop all audio elements
        audioElements.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
        });
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      let currentElementIndex = 0;
      let startTime = 0;
      let isPlaying = false;
      const transitionDuration = 500;

      function drawFrame() {
        if (currentElementIndex >= mediaElements.length) {
          // Only wait for the last element if it's a video
          const lastElement = mediaElements[mediaElements.length - 1];
          const currentTime = performance.now() - startTime;
          
          if (lastElement.type === 'video' && currentTime < lastElement.duration) {
            requestAnimationFrame(drawFrame);
            return;
          }
          
          mediaRecorder.stop();
          return;
        }

        const currentElement = mediaElements[currentElementIndex];
        const currentTime = performance.now() - startTime;
        const nextElement = mediaElements[currentElementIndex + 1];

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw current element with exact timing
        if (currentElement.type === 'video') {
          const video = currentElement.element;
          if (!isPlaying) {
            video.currentTime = currentElement.trimStart || 0;
            video.play().catch(e => console.error("Video play error:", e));
            isPlaying = true;
          }
          
          // Check if we need to stop the video
          if (currentElement.trimmed && video.currentTime >= currentElement.trimEnd) {
            video.pause();
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(currentElement.element, 0, 0, canvas.width, canvas.height);
        }

        // Draw logo if enabled
        if (options.logoImage) {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.15;
          const logoX = options.logoPosition === 'top-left' ? 20 : canvas.width - logoSize - 20;
          const logoY = 20;
          ctx.drawImage(options.logoImage, logoX, logoY, logoSize, logoSize);
        }

        // Apply transition if needed
        if (nextElement && currentTime >= currentElement.duration - transitionDuration) {
          const transitionProgress = (currentTime - (currentElement.duration - transitionDuration)) / transitionDuration;
          
          if (selectedTransition.type !== 'none') {
            ctx.globalAlpha = 1 - transitionProgress;
            ctx.drawImage(currentElement.type === 'video' ? currentElement.element : currentElement.element, 0, 0, canvas.width, canvas.height);
            
            ctx.globalAlpha = transitionProgress;
            if (nextElement.type === 'video') {
              const nextVideo = nextElement.element;
              nextVideo.currentTime = nextElement.trimStart || 0;
              nextVideo.play().catch(e => console.error("Video play error:", e));
            }
            
            // Apply transition effect
            switch (selectedTransition.type) {
              case 'fade':
                ctx.globalAlpha = transitionProgress;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                break;
              case 'slide':
                ctx.drawImage(
                  nextElement.element,
                  canvas.width * (1 - transitionProgress),
                  0,
                  canvas.width,
                  canvas.height
                );
                break;
              case 'blur':
                ctx.filter = `blur(${(1 - transitionProgress) * 10}px)`;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none';
                break;
            }
          }
        }

        // Check if we should move to next element
        if (currentTime >= currentElement.duration) {
          if (currentElement.type === 'video') {
            currentElement.element.pause();
          }
          currentElementIndex++;
          startTime = performance.now();
          isPlaying = false;
        }

        requestAnimationFrame(drawFrame);
      }

      // Start recording and audio together
      mediaRecorder.start();
      startTime = performance.now();
      // Start audio before any media elements
      startAudio();
      drawFrame();
    } else {
      // If no audio, proceed with video recording only
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      let currentElementIndex = 0;
      let startTime = 0;
      let isPlaying = false;
      const transitionDuration = 500;

      function drawFrame() {
        if (currentElementIndex >= mediaElements.length) {
          // Only wait for the last element if it's a video
          const lastElement = mediaElements[mediaElements.length - 1];
          const currentTime = performance.now() - startTime;
          
          if (lastElement.type === 'video' && currentTime < lastElement.duration) {
            requestAnimationFrame(drawFrame);
            return;
          }
          
          mediaRecorder.stop();
          return;
        }

        const currentElement = mediaElements[currentElementIndex];
        const currentTime = performance.now() - startTime;
        const nextElement = mediaElements[currentElementIndex + 1];

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw current element with exact timing
        if (currentElement.type === 'video') {
          const video = currentElement.element;
          if (!isPlaying) {
            video.currentTime = currentElement.trimStart || 0;
            video.play().catch(e => console.error("Video play error:", e));
            isPlaying = true;
          }
          
          // Check if we need to stop the video
          if (currentElement.trimmed && video.currentTime >= currentElement.trimEnd) {
            video.pause();
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(currentElement.element, 0, 0, canvas.width, canvas.height);
        }

        // Draw logo if enabled
        if (options.logoImage) {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.15;
          const logoX = options.logoPosition === 'top-left' ? 20 : canvas.width - logoSize - 20;
          const logoY = 20;
          ctx.drawImage(options.logoImage, logoX, logoY, logoSize, logoSize);
        }

        // Apply transition if needed
        if (nextElement && currentTime >= currentElement.duration - transitionDuration) {
          const transitionProgress = (currentTime - (currentElement.duration - transitionDuration)) / transitionDuration;
          
          if (selectedTransition.type !== 'none') {
            ctx.globalAlpha = 1 - transitionProgress;
            ctx.drawImage(currentElement.type === 'video' ? currentElement.element : currentElement.element, 0, 0, canvas.width, canvas.height);
            
            ctx.globalAlpha = transitionProgress;
            if (nextElement.type === 'video') {
              const nextVideo = nextElement.element;
              nextVideo.currentTime = nextElement.trimStart || 0;
              nextVideo.play().catch(e => console.error("Video play error:", e));
            }
            
            // Apply transition effect
            switch (selectedTransition.type) {
              case 'fade':
                ctx.globalAlpha = transitionProgress;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                break;
              case 'slide':
                ctx.drawImage(
                  nextElement.element,
                  canvas.width * (1 - transitionProgress),
                  0,
                  canvas.width,
                  canvas.height
                );
                break;
              case 'blur':
                ctx.filter = `blur(${(1 - transitionProgress) * 10}px)`;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none';
                break;
            }
          }
        }

        // Check if we should move to next element
        if (currentTime >= currentElement.duration) {
          if (currentElement.type === 'video') {
            currentElement.element.pause();
          }
          currentElementIndex++;
          startTime = performance.now();
          isPlaying = false;
        }

        requestAnimationFrame(drawFrame);
      }

      // Start recording
      mediaRecorder.start();
      startTime = performance.now();
      drawFrame();
    }
  });
}

async function recordMediaElementsManual(mediaElements, canvas, musicFiles, selectedTransition, progressCallback, options = {}) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream();
    
    // Add audio tracks if available
    if (musicFiles && musicFiles.length > 0) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Calculate total duration including inrow and outrow
      const totalDuration = mediaElements.reduce((sum, element) => sum + element.duration, 0);
      
      // Create and prepare all audio elements first
      const audioElements = musicFiles.map((music, index) => {
        const audio = new Audio(music.url);
        const source = audioContext.createMediaElementSource(audio);
        source.connect(audioDestination);
        
        // Calculate the start time for this music track based on previous tracks
        let startTime = 0;
        if (index > 0) {
          startTime = musicFiles.slice(0, index).reduce((sum, prevMusic) => {
            if (prevMusic.trimmed) {
              return sum + (prevMusic.trimEnd - prevMusic.trimStart);
            }
            return sum + (prevMusic.duration || 0);
          }, 0);
        }

        // Set exact duration and trim points for music
        audio.addEventListener('timeupdate', () => {
          if (music.trimmed) {
            if (audio.currentTime < music.trimStart) {
              audio.currentTime = music.trimStart;
            } else if (audio.currentTime >= music.trimEnd) {
              audio.pause();
            }
          } else {
            // For untrimmed music, automatically trim to fit the remaining duration
            const remainingDuration = totalDuration / 1000 - startTime;
            if (audio.currentTime >= remainingDuration) {
              audio.pause();
            }
          }
        });
        
        return {
          audio,
          startTime,
          duration: music.trimmed ? 
            (music.trimEnd - music.trimStart) * 1000 : 
            (music.duration || totalDuration) * 1000
        };
      });

      // Add audio tracks to the stream
      audioDestination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });

      // Start all audio elements when recording starts
      const startAudio = () => {
        let currentMusicIndex = 0;
        let isPlaying = false;

        const playNextMusic = () => {
          if (currentMusicIndex < audioElements.length) {
            const { audio, startTime, duration } = audioElements[currentMusicIndex];
            const music = musicFiles[currentMusicIndex];
            
            if (music.trimmed) {
              audio.currentTime = music.trimStart;
            } else {
              audio.currentTime = 0;
            }

            audio.play().then(() => {
              isPlaying = true;
              
              setTimeout(() => {
                if (isPlaying) {
                  audio.pause();
                  currentMusicIndex++;
                  playNextMusic();
                }
              }, duration);
            }).catch(e => console.error("Audio play error:", e));
          }
        };

        // Start playing the first music track
        playNextMusic();

        // Return a function to stop all audio
        return () => {
          isPlaying = false;
          audioElements.forEach(({ audio }) => {
            audio.pause();
            audio.currentTime = 0;
          });
        };
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        // Stop all audio elements
        audioElements.forEach(({ audio }) => {
          audio.pause();
          audio.currentTime = 0;
        });
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      let currentElementIndex = 0;
      let startTime = 0;
      let isPlaying = false;
      const transitionDuration = 500;

      function drawFrame() {
        if (currentElementIndex >= mediaElements.length) {
          // Only wait for the last element if it's a video
          const lastElement = mediaElements[mediaElements.length - 1];
          const currentTime = performance.now() - startTime;
          
          if (lastElement.type === 'video' && currentTime < lastElement.duration) {
            requestAnimationFrame(drawFrame);
            return;
          }
          
          mediaRecorder.stop();
          return;
        }

        const currentElement = mediaElements[currentElementIndex];
        const currentTime = performance.now() - startTime;
        const nextElement = mediaElements[currentElementIndex + 1];

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw current element with exact timing
        if (currentElement.type === 'video') {
          const video = currentElement.element;
          if (!isPlaying) {
            video.currentTime = currentElement.trimStart || 0;
            video.play().catch(e => console.error("Video play error:", e));
            isPlaying = true;
          }
          
          // Check if we need to stop the video
          if (currentElement.trimmed && video.currentTime >= currentElement.trimEnd) {
            video.pause();
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(currentElement.element, 0, 0, canvas.width, canvas.height);
        }

        // Draw logo if enabled
        if (options.logoImage) {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.15;
          const logoX = options.logoPosition === 'top-left' ? 20 : canvas.width - logoSize - 20;
          const logoY = 20;
          ctx.drawImage(options.logoImage, logoX, logoY, logoSize, logoSize);
        }

        // Apply transition if needed
        if (nextElement && currentTime >= currentElement.duration - transitionDuration) {
          const transitionProgress = (currentTime - (currentElement.duration - transitionDuration)) / transitionDuration;
          
          if (selectedTransition.type !== 'none') {
            ctx.globalAlpha = 1 - transitionProgress;
            ctx.drawImage(currentElement.type === 'video' ? currentElement.element : currentElement.element, 0, 0, canvas.width, canvas.height);
            
            ctx.globalAlpha = transitionProgress;
            if (nextElement.type === 'video') {
              const nextVideo = nextElement.element;
              nextVideo.currentTime = nextElement.trimStart || 0;
              nextVideo.play().catch(e => console.error("Video play error:", e));
            }
            
            // Apply transition effect
            switch (selectedTransition.type) {
              case 'fade':
                ctx.globalAlpha = transitionProgress;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                break;
              case 'slide':
                ctx.drawImage(
                  nextElement.element,
                  canvas.width * (1 - transitionProgress),
                  0,
                  canvas.width,
                  canvas.height
                );
                break;
              case 'blur':
                ctx.filter = `blur(${(1 - transitionProgress) * 10}px)`;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none';
                break;
            }
          }
        }

        // Check if we should move to next element
        if (currentTime >= currentElement.duration) {
          if (currentElement.type === 'video') {
            currentElement.element.pause();
          }
          currentElementIndex++;
          startTime = performance.now();
          isPlaying = false;
        }

        requestAnimationFrame(drawFrame);
      }

      // Start recording and audio together
      mediaRecorder.start();
      startTime = performance.now();
      const stopAudio = startAudio();
      drawFrame();

      // Clean up audio when recording stops
      mediaRecorder.onstop = () => {
        stopAudio();
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
    } else {
      // If no audio, proceed with video recording only
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      let currentElementIndex = 0;
      let startTime = 0;
      let isPlaying = false;
      const transitionDuration = 500;

      function drawFrame() {
        if (currentElementIndex >= mediaElements.length) {
          // Only wait for the last element if it's a video
          const lastElement = mediaElements[mediaElements.length - 1];
          const currentTime = performance.now() - startTime;
          
          if (lastElement.type === 'video' && currentTime < lastElement.duration) {
            requestAnimationFrame(drawFrame);
            return;
          }
          
          mediaRecorder.stop();
          return;
        }

        const currentElement = mediaElements[currentElementIndex];
        const currentTime = performance.now() - startTime;
        const nextElement = mediaElements[currentElementIndex + 1];

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw current element with exact timing
        if (currentElement.type === 'video') {
          const video = currentElement.element;
          if (!isPlaying) {
            video.currentTime = currentElement.trimStart || 0;
            video.play().catch(e => console.error("Video play error:", e));
            isPlaying = true;
          }
          
          // Check if we need to stop the video
          if (currentElement.trimmed && video.currentTime >= currentElement.trimEnd) {
            video.pause();
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(currentElement.element, 0, 0, canvas.width, canvas.height);
        }

        // Draw logo if enabled
        if (options.logoImage) {
          const logoSize = Math.min(canvas.width, canvas.height) * 0.15;
          const logoX = options.logoPosition === 'top-left' ? 20 : canvas.width - logoSize - 20;
          const logoY = 20;
          ctx.drawImage(options.logoImage, logoX, logoY, logoSize, logoSize);
        }

        // Apply transition if needed
        if (nextElement && currentTime >= currentElement.duration - transitionDuration) {
          const transitionProgress = (currentTime - (currentElement.duration - transitionDuration)) / transitionDuration;
          
          if (selectedTransition.type !== 'none') {
            ctx.globalAlpha = 1 - transitionProgress;
            ctx.drawImage(currentElement.type === 'video' ? currentElement.element : currentElement.element, 0, 0, canvas.width, canvas.height);
            
            ctx.globalAlpha = transitionProgress;
            if (nextElement.type === 'video') {
              const nextVideo = nextElement.element;
              nextVideo.currentTime = nextElement.trimStart || 0;
              nextVideo.play().catch(e => console.error("Video play error:", e));
            }
            
            // Apply transition effect
            switch (selectedTransition.type) {
              case 'fade':
                ctx.globalAlpha = transitionProgress;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                break;
              case 'slide':
                ctx.drawImage(
                  nextElement.element,
                  canvas.width * (1 - transitionProgress),
                  0,
                  canvas.width,
                  canvas.height
                );
                break;
              case 'blur':
                ctx.filter = `blur(${(1 - transitionProgress) * 10}px)`;
                ctx.drawImage(nextElement.element, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none';
                break;
            }
          }
        }

        // Check if we should move to next element
        if (currentTime >= currentElement.duration) {
          if (currentElement.type === 'video') {
            currentElement.element.pause();
          }
          currentElementIndex++;
          startTime = performance.now();
          isPlaying = false;
        }

        requestAnimationFrame(drawFrame);
      }

      // Start recording
      mediaRecorder.start();
      startTime = performance.now();
      drawFrame();
    }
  });
}