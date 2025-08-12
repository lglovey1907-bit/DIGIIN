import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from 'lucide-react';

interface GalleryPhoto {
  filename: string;
  caption: string;
  timestamp: string;
  url: string;
}

interface GalleryData {
  id: string;
  sectionName: string;
  photos: GalleryPhoto[];
  createdAt: string;
}

export function PhotoGallery() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (galleryId) {
      fetchGallery(galleryId);
    }
  }, [galleryId]);

  const fetchGallery = async (id: string) => {
    try {
      const response = await fetch(`/api/photo-gallery/${id}`);
      if (response.ok) {
        const data = await response.json();
        setGallery(data);
      } else {
        console.error('Gallery not found');
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = (photo: GalleryPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Gallery Not Found</h2>
            <p className="text-gray-600">The requested photo gallery could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Inspection Photos</h1>
                <p className="text-gray-600 mt-1">{gallery.sectionName}</p>
              </div>
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-gray-600">
              {gallery.photos.length} photos • Created on {new Date(gallery.createdAt).toLocaleDateString()}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.photos.map((photo, index) => (
                <div
                  key={photo.filename}
                  className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="opacity-0 group-hover:opacity-100 bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                onClick={() => setSelectedPhoto(null)}
              >
                <div className="max-w-4xl max-h-[90vh] relative">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption}
                    className="max-w-full max-h-full object-contain"
                  />
                  {selectedPhoto.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                      <p className="text-lg">{selectedPhoto.caption}</p>
                      <p className="text-sm opacity-75">
                        {new Date(selectedPhoto.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <Button
                    className="absolute top-4 right-4"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(selectedPhoto);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}