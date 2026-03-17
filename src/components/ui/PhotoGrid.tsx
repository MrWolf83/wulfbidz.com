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
    <div className="space-y-3 -mx-6">
      <div className="relative w-full bg-gray-900 overflow-hidden group" style={{ minHeight: '500px' }}>
        {isVideo(currentIndex) ? (
          <video
            src={allMedia[currentIndex]}
            className="w-full h-full object-contain"
            controls
            autoPlay
            style={{ maxHeight: '600px' }}
          />
        ) : (
          <img
            src={allMedia[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            style={{ maxHeight: '600px' }}
          />
        )}

        {totalItems > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={28} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 z-10">
              {isVideo(currentIndex) && <Video size={16} />}
              {currentIndex + 1} / {totalItems}
            </div>
          </>
        )}
      </div>

      {totalItems > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 px-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-red-500 ring-2 ring-red-300'
                  : 'border-gray-300 hover:border-red-400'
              }`}
            >
              {isVideo(index) ? (
                <>
                  <video
                    src={media}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Video size={24} className="text-white" />
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
