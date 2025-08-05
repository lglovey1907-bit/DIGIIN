from PIL import Image, ImageDraw
import os

# Create a simple test image
img = Image.new('RGB', (200, 200), color='lightblue')
draw = ImageDraw.Draw(img)
draw.text((50, 90), "INSPECTION", fill='black')
draw.text((70, 110), "PHOTO", fill='black')
img.save('test_inspection_photo.png')
print(f"Created test image: {os.path.getsize('test_inspection_photo.png')} bytes")
