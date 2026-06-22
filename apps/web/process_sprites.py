from PIL import Image
import os

def process_sprite(filepath, output_filepath):
    try:
        img = Image.open(filepath).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # item is (R, G, B, A)
            # Magenta is (255, 0, 255)
            # Some compression might make it slightly different, so use a threshold
            if item[0] > 200 and item[1] < 50 and item[2] > 200:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)

        img.putdata(newData)
        
        # Now we need to crop out the massive transparent top/bottom space.
        bbox = img.getbbox()
        if bbox:
            img = img.crop((0, bbox[1], img.width, bbox[3])) # keep original width
            
        img.save(output_filepath, "PNG")
        print(f"Processed {filepath} successfully")
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")

assets_dir = "/Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/public/assets"
process_sprite(os.path.join(assets_dir, "egg_sprite.png"), os.path.join(assets_dir, "egg_sprite_clean.png"))
process_sprite(os.path.join(assets_dir, "baby_rabbit_sprite.png"), os.path.join(assets_dir, "baby_rabbit_sprite_clean.png"))
