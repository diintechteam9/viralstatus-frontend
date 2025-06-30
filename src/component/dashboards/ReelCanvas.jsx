import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

const ReelCanvas = forwardRef(
  (
    {
      mediaFiles,
      setMediaFiles,
      musicFiles,
      selectedMediaIndex,
      setSelectedMediaIndex,
      setMergedVideoUrl,
      canvasSize,
      logoOptions,
      showOutrow,
      showInrow,
    },
    ref
  ) => {
    const [sizes, setSizes] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [localMergedVideoUrl, setLocalMergedVideoUrl] = useState(null);
    const videoRef = useRef(null);

    // Add a new state to track if content is from template
    const [isFromTemplate, setIsFromTemplate] = useState(false);

    // Expose setTemplateContent method through ref
    useImperativeHandle(ref, () => ({
      setTemplateContent: (isTemplate) => {
        setIsFromTemplate(isTemplate);
      },
    }));

    // Handle playing the merged video when it's ready
    useEffect(() => {
      if (localMergedVideoUrl && videoRef.current) {
        videoRef.current.src = localMergedVideoUrl;
        videoRef.current.load();
        videoRef.current
          .play()
          .catch((e) => console.error("Playback error:", e));
      }
    }, [localMergedVideoUrl]);

    // Update parent component when merged video URL changes
    useEffect(() => {
      if (localMergedVideoUrl) {
        console.log("Setting merged video URL in parent:", localMergedVideoUrl);
        setMergedVideoUrl(localMergedVideoUrl);
      }
    }, [localMergedVideoUrl, setMergedVideoUrl]);

    // Set first media as selected when files are added
    useEffect(() => {
      if (mediaFiles.length > 0 && selectedMediaIndex === null) {
        setSelectedMediaIndex(0);
      }
    }, [mediaFiles.length, selectedMediaIndex]);

    const startResize = useCallback(
      (e, idx, direction) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = sizes[idx]?.width || 300;
        const startHeight = sizes[idx]?.height || 200;

        const handleMouseMove = (moveEvent) => {
          let newWidth = startWidth;
          let newHeight = startHeight;

          if (direction === "right") {
            newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
          }
          if (direction === "bottom") {
            newHeight = Math.max(
              50,
              startHeight + (moveEvent.clientY - startY)
            );
          }

          setSizes((prev) => ({
            ...prev,
            [idx]: { width: newWidth, height: newHeight },
          }));
        };

        const handleMouseUp = () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      },
      [sizes]
    );

    // Check if the current media is the merged video
    const isMergedVideo =
      mediaFiles.length === 1 && mediaFiles[0]?.name === "merged-video.webm";

    return (
      <div className="flex-1 flex flex-col items-center justify-start bg-gray text-white p-4 overflow-auto relative">
        {mediaFiles.length > 0 && (
          <>
            <div className="mb-3 w-full flex justify-center">
              {selectedMediaIndex !== null &&
                mediaFiles[selectedMediaIndex] && (
                  <div
                    className="relative bg-black border-3 border-yellow-400 border-dotted p-7 mt-18"
                    style={{
                      width: sizes[selectedMediaIndex]?.width || 430,
                      height: sizes[selectedMediaIndex]?.height || 330,
                    }}
                  >
                    {mediaFiles[selectedMediaIndex].type === "video" ? (
                      <video
                        ref={
                          mediaFiles[selectedMediaIndex].name ===
                          "merged-video.webm"
                            ? videoRef
                            : null
                        }
                        src={mediaFiles[selectedMediaIndex].url}
                        controls
                        className="w-full h-full object-contain"
                        autoPlay={
                          mediaFiles[selectedMediaIndex].name ===
                          "merged-video.webm"
                        }
                        muted
                        onLoadedMetadata={() => {
                          console.log(
                            "Video metadata loaded:",
                            mediaFiles[selectedMediaIndex].url
                          );
                        }}
                        onError={(e) => {
                          console.error("Video error:", e);
                        }}
                      />
                    ) : (
                      <img
                        src={mediaFiles[selectedMediaIndex].url}
                        alt={mediaFiles[selectedMediaIndex].name}
                        className="w-full h-full object-contain"
                      />
                    )}

                    {["right", "bottom"].map((dir) => (
                      <div
                        key={dir}
                        onMouseDown={(e) =>
                          startResize(e, selectedMediaIndex, dir)
                        }
                        className={`absolute ${dir}-0 ${
                          dir === "right"
                            ? "top-0 w-2 h-full"
                            : "left-0 w-full h-2"
                        } opacity-50 cursor-${
                          dir === "right" ? "ew-resize" : "ns-resize"
                        }`}
                      />
                    ))}
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    );
  }
);

export default ReelCanvas;
