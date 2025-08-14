import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Eye, Trash2, QrCode, Download, Star } from "lucide-react";
import QRCode from 'qrcode';

interface PhotoData {
  id: string;
  file: File;
  url: string;
  caption: string;
  timestamp: Date;
  includeInReport: boolean;
}

interface PhotoManagerProps {
  sectionId: string;
  sectionName: string;
  maxInReport?: number;
  onPhotosChange: (photos: PhotoData[]) => void;
}

export function PhotoManager({ 
  sectionId, 
  sectionName, 
  maxInReport = 2,
  onPhotosChange 
}: PhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please use file upload instead.');
    }
  };

  const attachStreamToVideo = (stream: MediaStream, retries = 0) => {
    if (retries > 10) {
      console.error('Failed to attach stream after 10 retries');
      return;
    }
    
    if (!videoRef.current) {
      setTimeout(() => attachStreamToVideo(stream, retries + 1), 200);
      return;
    }
    
    videoRef.current.srcObject = stream;
    console.log('Stream attached successfully!');
  };

  useEffect(() => {
    if (showCamera && streamRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [showCamera]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `inspection_${sectionId}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      
      addPhoto(file);
    }, 'image/jpeg', 0.8);
    
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        addPhoto(file);
      }
    });
    
    // Reset input
    event.target.value = '';
  };

  const addPhoto = (file: File) => {
    const photoData: PhotoData = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      caption: '',
      timestamp: new Date(),
      includeInReport: photos.filter(p => p.includeInReport).length < maxInReport
    };

    const updatedPhotos = [...photos, photoData];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = photos.find(p => p.id === photoId);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const toggleIncludeInReport = (photoId: string) => {
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        const currentInReportCount = photos.filter(p => p.includeInReport && p.id !== photoId).length;
        if (!photo.includeInReport && currentInReportCount >= maxInReport) {
          alert(`Maximum ${maxInReport} photos can be included in the report`);
          return photo;
        }
        return { ...photo, includeInReport: !photo.includeInReport };
      }
      return photo;
    });
    
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const updateCaption = (photoId: string, caption: string) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, caption } : photo
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const generateQRCode = async () => {
    const additionalPhotos = photos.filter(p => !p.includeInReport);
    if (additionalPhotos.length === 0) {
      alert('No additional photos to generate QR code for');
      return;
    }

    // Create a gallery URL (you'd implement this endpoint)
    const galleryId = `gallery_${sectionId}_${Date.now()}`;
    const galleryUrl = `${window.location.origin}/photo-gallery/${galleryId}`;
    
    // Upload additional photos to server (implement this API)
    await uploadPhotosToServer(galleryId, additionalPhotos);
    
    const qrDataUrl = await QRCode.toDataURL(galleryUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    setQrCodeUrl(qrDataUrl);
    setShowQR(true);
  };

  const uploadPhotosToServer = async (galleryId: string, photos: PhotoData[]) => {
    const formData = new FormData();
    formData.append('galleryId', galleryId);
    formData.append('sectionName', sectionName);
    
    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo.file);
      formData.append(`caption_${index}`, photo.caption);
    });

    try {
      await fetch('/api/upload-gallery', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr_code_${sectionName}_${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const inReportPhotos = photos.filter(p => p.includeInReport);
  const additionalPhotos = photos.filter(p => !p.includeInReport);

  return (
    <Card className="mt-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Photo Documentation</h4>
          <Badge variant="outline">
            {inReportPhotos.length}/{maxInReport} in report
          </Badge>
        </div>

        {/* Photo Capture Options */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startCamera}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          
          {additionalPhotos.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateQRCode}
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative group border-2 rounded-lg overflow-hidden ${
                  photo.includeInReport ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Inspection photo'}
                  className="w-full h-24 object-cover"
                />
                
                {photo.includeInReport && (
                  <Star className="absolute top-1 left-1 w-4 h-4 text-yellow-500 fill-current" />
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white"
                      onClick={() => {
                        setPreviewPhoto(photo);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white"
                      onClick={() => toggleIncludeInReport(photo.id)}
                    >
                      <Star className={`w-4 h-4 ${photo.includeInReport ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-white text-red-600"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Photos Info */}
        {additionalPhotos.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>Additional Photos:</strong> {additionalPhotos.length} photos will be accessible via QR code
          </div>
        )}

        {/* Camera Modal */}
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Take Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (streamRef.current && videoRef.current) {
                      videoRef.current.srcObject = streamRef.current;
                      console.log('Manual stream attachment');
                    }
                  }}
                >
                  Fix Video
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Photo Preview</DialogTitle>
            </DialogHeader>
            {previewPhoto && (
              <div className="space-y-4">
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.caption || 'Inspection photo'}
                  className="w-full rounded-lg"
                />
                <div>
                  <label className="text-sm font-medium">Caption</label>
                  <input
                    type="text"
                    value={previewPhoto.caption}
                    onChange={(e) => updateCaption(previewPhoto.id, e.target.value)}
                    placeholder="Add photo caption..."
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={previewPhoto.includeInReport}
                    onChange={() => toggleIncludeInReport(previewPhoto.id)}
                    id="includeInReport"
                  />
                  <label htmlFor="includeInReport" className="text-sm">
                    Include in report ({inReportPhotos.length}/{maxInReport})
                  </label>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Modal */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Additional Photos QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
              )}
              <p className="text-sm text-gray-600">
                Scan this QR code to view {additionalPhotos.length} additional photos
              </p>
              <Button onClick={downloadQRCode} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}// Camera timing fix
