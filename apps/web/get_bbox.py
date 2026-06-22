from PIL import Image

img = Image.open('public/assets/baby_rabbit_single.png').convert('RGBA')
bbox = img.getbbox()
print(f"Bounding box: {bbox}")
