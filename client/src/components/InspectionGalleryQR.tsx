import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InspectionGalleryQRProps {
  inspectionId: string;
}

export const InspectionGalleryQR: React.FC<InspectionGalleryQRProps> = ({ inspectionId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/inspections/${inspectionId}/gallery-qr`)
      .then(res => res.json())
      .then(data => setQrCodeUrl(data.qrCodeUrl))
      .catch(() => setQrCodeUrl(null));

    fetch(`/api/inspections/${inspectionId}/gallery`)
      .then(res => res.json())
      .then(data => setGalleryImages(data.images || []))
      .catch(() => setGalleryImages([]));
  }, [inspectionId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("qrCode", e.target.files[0]);
    try {
      await fetch(`/api/inspections/${inspectionId}/upload-qr`, {
        method: "POST",
        body: formData,
      });
      const res = await fetch(`/api/inspections/${inspectionId}/gallery-qr`);
      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
    } catch {
      // Handle error
    }
    setUploading(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Inspection Gallery & QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label>Gallery QR Code</Label>
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Gallery QR Code" className="w-32 h-32" />
          ) : (
            <div>No QR code available.</div>
          )}
        </div>
        <div className="mb-4">
          <Label>Upload QR Code</Label>
          <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </div>
        <div>
          <Label>Gallery Images</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {galleryImages.length > 0 ? (
              galleryImages.map((img, idx) => (
                <img key={idx} src={img} alt={`Gallery ${idx + 1}`} className="w-24 h-24 object-cover rounded" />
              ))
            ) : (
              <div>No images found.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};