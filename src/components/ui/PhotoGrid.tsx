import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';

interface PhotoGridProps {
  photos: string[];
  videos?: string[];
}

export function PhotoGrid({ photos, videos = [] }: PhotoGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allMedia = [...photos, ...videos];
  const totalItems = allMedia.length;

  if (totalItems === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No media available</span>
      </div>
    );
  }

  const isVideo = (index: number) => index >= photos.length;

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden group">
        {isVideo(currentIndex) ? (
          <video
            src={allMedia[currentIndex]}
            className="w-full h-full object-contain"
            controls
            autoPlay
          />
        ) : (
          <img
            src={allMedia[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
        )}

        {totalItems > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {isVideo(currentIndex) && <Video size={14} />}
              {currentIndex + 1} / {totalItems}
            </div>
          </>
        )}
      </div>

      {totalItems > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-red-500 scale-105'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {isVideo(index) ? (
                <>
                  <video
                    src={media}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Video size={20} className="text-white" />
                  </div>
                </>
              ) : (
                <img
                  src={media}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
