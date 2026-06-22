from PIL import Image

img = Image.open('public/assets/baby_rabbit_sprite_clean.png')
# Crop a square from the center of the image
w, h = img.size
# Let's just crop a 300x300 box from the middle
left = w/2 - 150
top = h/2 - 150
right = w/2 + 150
bottom = h/2 + 150
cropped = img.crop((left, top, right, bottom))
cropped.save('public/assets/baby_rabbit_single.png')
print("Cropped successfully")
