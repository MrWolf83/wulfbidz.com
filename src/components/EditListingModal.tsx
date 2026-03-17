import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase, type Listing, type Photo } from '../lib/supabase';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onUpdate: () => void;
}

export default function EditListingModal({ isOpen, onClose, listing, onUpdate }: EditListingModalProps) {
  const [description, setDescription] = useState(listing.description);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPhotos();
      setDescription(listing.description);
    }
  }, [isOpen, listing.id]);

  const loadPhotos = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listing.id)
      .order('position', { ascending: true });

    if (data) {
      setPhotos(data);
    }
    setIsLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);

    const newPhotos: Photo[] = [];
    const nextPosition = photos.length;

    for (let i = 0; i < Math.min(files.length, 20 - photos.length); i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${listing.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('listing-photos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(fileName);

      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert({
          listing_id: listing.id,
          url: publicUrl,
          position: nextPosition + i,
        })
        .select()
        .single();

      if (!photoError && photoData) {
        newPhotos.push(photoData);
      }
    }

    setPhotos([...photos, ...newPhotos]);
    setUploadingPhotos(false);
    e.target.value = '';
  };

  const handleDeletePhoto = async (photo: Photo) => {
    const confirmed = confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    const fileName = photo.url.split('/').pop();
    if (fileName) {
      await supabase.storage
        .from('listing-photos')
        .remove([`${listing.id}/${fileName}`]);
    }

    await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id);

    const updatedPhotos = photos.filter(p => p.id !== photo.id);
    await Promise.all(
      updatedPhotos.map((p, index) =>
        supabase
          .from('photos')
          .update({ position: index })
          .eq('id', p.id)
      )
    );

    setPhotos(updatedPhotos);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from('listings')
      .update({ description })
      .eq('id', listing.id);

    if (error) {
      alert('Failed to update listing. Please try again.');
      setIsSaving(false);
      return;
    }

    alert('Listing updated successfully!');
    setIsSaving(false);
    onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Edit Listing: {listing.year} {listing.make} {listing.model}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Describe the vehicle's condition, features, history, etc."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Photos ({photos.length}/20)
              </label>
              {photos.length < 20 && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Upload size={16} />
                    <span className="text-sm font-medium">
                      {uploadingPhotos ? 'Uploading...' : 'Add Photos'}
                    </span>
                  </div>
                </label>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading photos...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No photos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Photo ${photo.position + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                      #{photo.position + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
