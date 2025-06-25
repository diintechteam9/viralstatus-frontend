import { useState, useCallback, useRef } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Timeline from './Timeline';
import UploadPanel from './UploadPanel';
import TextPanel from './TextPanel';
import MusicPanel from './MusicPanel';
import SavePanel from './SavePanel';
import CanvasChoose from './CanvasChoose';
import TransitionPanel from './TransitionPanel';
import TemplatePanel from './TemplatePanel';
import ContentLibrary from './ContentLibrary';
import { generateTemplate } from '../utils/templateGenerator';

function VideoEditor() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [textElements, setTextElements] = useState([]);
  const [musicFiles, setMusicFiles] = useState([]);
  const [activePanel, setActivePanel] = useState('');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1920 }); // Default to Full Portrait
  const [selectedTransition, setSelectedTransition] = useState({ type: 'none', name: 'No Transition' }); // Default transition
  const [logoOptions, setLogoOptions] = useState({ showLogo: false, logoPosition: 'top-right' });
  const [showOutrow, setShowOutrow] = useState(false);
  const [showInrow, setShowInrow] = useState(false);

  const resetProject = useCallback(() => {
    setMediaFiles([]);
    setTextElements([]);
    setMusicFiles([]);
    setActivePanel('');
    setSelectedMediaIndex(0);
    setMergedVideoUrl(null);
  }, []);

  const processFiles = useCallback((files) => {
    const newFiles = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
      start: 0,
      end: null,
    }));

    setMediaFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined;
    });

    // Select first file if this is the first upload
    if (mediaFiles.length === 0 && newFiles.length > 0) {
      setSelectedMediaIndex(0);
    }

    setActivePanel('');
  }, [mediaFiles.length]);

  const processMusicFiles = useCallback((files) => {
    const newMusicFiles = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: 'audio',
      name: file.name,
      start: 0,
      end: null,
      trimmed: false,
      trimStart: 0,
      trimEnd: null,
      duration: null
    }));

    // Get audio duration for each file
    newMusicFiles.forEach(music => {
      const audio = new Audio(music.url);
      audio.addEventListener('loadedmetadata', () => {
        setMusicFiles(prev => prev.map(m => {
          if (m.url === music.url) {
            return {
              ...m,
              duration: audio.duration,
              trimEnd: audio.duration
            };
          }
          return m;
        }));
      });
    });

    setMusicFiles((prev) => [...prev, ...newMusicFiles]);
    setActivePanel('');
  }, []);

  const handleFileChange = useCallback((e) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  }, [processFiles]);

  const handleMusicFileChange = useCallback((e) => {
    if (!e.target.files) return;
    processMusicFiles(Array.from(e.target.files));
  }, [processMusicFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleMusicDrop = useCallback((e) => {
    e.preventDefault();
    processMusicFiles(Array.from(e.dataTransfer.files));
  }, [processMusicFiles]);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  const handleMenuClick = useCallback((menuName) => {
    setActivePanel((prev) => (prev === menuName ? '' : menuName));
  }, []);

  const handleAddText = useCallback((text, font) => {
    setTextElements((prev) => [
      ...prev,
      {
        text,
        font,
        x: 100,
        y: 100,
        fontSize: 28,
        color: '#ffffff'
      },
    ]);
    setActivePanel('');
  }, []);

  const handleRemoveMusic = useCallback((index) => {
    setMusicFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCanvasSizeSelect = useCallback((size) => {
    setCanvasSize({ width: size.width, height: size.height });
    setActivePanel('');
  }, []);

  const handleTransitionSelect = useCallback((transition) => {
    setSelectedTransition(transition);
    setActivePanel('');
  }, []);

  const handleTemplateGenerate = useCallback(async (numImages, duration, options) => {
    try {
      const { mediaFiles: templateMediaFiles, musicFiles: templateMusicFiles } = await generateTemplate(numImages, duration, options);
      setMediaFiles(templateMediaFiles);
      setMusicFiles(templateMusicFiles);
      setLogoOptions({
        showLogo: options.showLogo,
        logoPosition: options.logoPosition
      });
      setShowOutrow(options.showOutrow);
      setShowInrow(options.showInrow);
      setActivePanel('');
      
      // Set template flag to true when template is generated
      if (templateMediaFiles.length > 0) {
        setSelectedMediaIndex(0);
        // Pass template flag to Canvas
        if (canvasRef.current) {
          canvasRef.current.setTemplateContent(true);
        }
      }
    } catch (error) {
      console.error('Error generating template:', error);
      alert('Error generating template. Please try again.');
    }
  }, []);

  // Add ref for Canvas component
  const canvasRef = useRef(null);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Topbar onNewVideo={resetProject} />

      <div className="flex flex-1 relative w-full h-full overflow-hidden">
        <Sidebar activePanel={activePanel} onMenuClick={handleMenuClick} />

        {/* Sidebar Panels */}
        <div className="absolute left-20 top-0 bottom-0 z-10">
          {activePanel === 'Files' && (
            <div className="w-80 h-full">
              <UploadPanel
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                handleDragOver={handleDragOver}
              />
            </div>
          )}

          {activePanel === 'Text' && (
            <div className="w-80 h-full">
              <TextPanel handleAddText={handleAddText} />
            </div>
          )}

          {activePanel === 'Music' && (
            <div className="w-80 h-full">
              <MusicPanel
                handleFileChange={handleMusicFileChange}
                handleDrop={handleMusicDrop}
                handleDragOver={handleDragOver}
                musicFiles={musicFiles}
                onRemoveMusic={handleRemoveMusic}
              />
            </div>
          )}

          {activePanel === 'Canvas' && (
            <div className="w-80 h-full">
              <CanvasChoose onSizeSelect={handleCanvasSizeSelect} />
            </div>
          )}

          {activePanel === 'Transition' && (
            <div className="w-80 h-full">
              <TransitionPanel onTransitionSelect={handleTransitionSelect} />
            </div>
          )}

          {activePanel === 'Template' && (
            <div className="w-80 h-full">
              <TemplatePanel onGenerate={handleTemplateGenerate} />
            </div>
          )}

          {activePanel === 'Content Library' && (
            <div className="w-80 h-full">
              <ContentLibrary />
            </div>
          )}

          {activePanel === 'Save' && (
            <div className="w-80 h-full">
              <SavePanel mergedVideoUrl={mergedVideoUrl} />
            </div>
          )}
        </div>

        {/* Canvas - Now it will stay in place */}
        <div className="flex-1 relative bg-gray border-r-2 border-white w-full h-full overflow-hidden">
          <Canvas
            ref={canvasRef}
            mediaFiles={mediaFiles}
            setMediaFiles={setMediaFiles}
            textElements={textElements}
            setTextElements={setTextElements}
            selectedMediaIndex={selectedMediaIndex}
            setSelectedMediaIndex={setSelectedMediaIndex}
            musicFiles={musicFiles}
            setMergedVideoUrl={setMergedVideoUrl}
            canvasSize={canvasSize}
            selectedTransition={selectedTransition}
            logoOptions={logoOptions}
            showOutrow={showOutrow}
            showInrow={showInrow}
          />
        </div>
      </div>

      <div className='border border-white h-40 w-full'>
        <Timeline
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          currentTime={0}
          onSelect={setSelectedMediaIndex}
          selectedMediaIndex={selectedMediaIndex}
          musicFiles={musicFiles}
          setMusicFiles={setMusicFiles}
        />
      </div>
    </div>
  );
}

export default VideoEditor;