import os
from PIL import Image

def process_grid_to_strip(input_path, output_path, rows, cols, max_frames=None):
    print(f"Processing {input_path}...")
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return False
        
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # 1. Convert magenta background to transparent
    datas = img.getdata()
    newData = []
    for item in datas:
        # Magenta thresholding: R > 200, G < 50, B > 200
        if item[0] > 200 and item[1] < 60 and item[2] > 200:
            newData.append((0, 0, 0, 0)) # transparent
        else:
            newData.append(item)
    img.putdata(newData)
    
    # 2. Divide into grid cells
    cell_w = w // cols
    cell_h = h // rows
    
    frames = []
    num_frames = max_frames if max_frames else (rows * cols)
    
    # Extract each frame
    for r in range(rows):
        for c in range(cols):
            if len(frames) >= num_frames:
                break
                
            # Crop cell
            left = c * cell_w
            top = r * cell_h
            right = left + cell_w
            bottom = top + cell_h
            
            cell = img.crop((left, top, right, bottom))
            
            # Find bounding box of content in this cell
            bbox = cell.getbbox()
            if bbox:
                # Crop to content
                cropped_cell = cell.crop(bbox)
                frames.append((cropped_cell, bbox))
            else:
                # Empty cell
                pass
                
    if not frames:
        print("No frames found!")
        return False
        
    # 3. Find max dimensions to create a uniform frame size
    max_w = 0
    max_h = 0
    for frame, _ in frames:
        max_w = max(max_w, frame.width)
        max_h = max(max_h, frame.height)
        
    # Add some padding to avoid clipping
    padding = 10
    frame_w = max_w + padding * 2
    frame_h = max_h + padding * 2
    
    # 4. Stitch frames into a single horizontal strip
    strip_w = frame_w * len(frames)
    strip_h = frame_h
    strip = Image.new("RGBA", (strip_w, strip_h), (0, 0, 0, 0))
    
    for i, (frame, _) in enumerate(frames):
        # Center the cropped frame in its grid slot
        offset_x = (frame_w - frame.width) // 2
        offset_y = (frame_h - frame.height) // 2
        
        paste_x = i * frame_w + offset_x
        paste_y = offset_y
        
        strip.paste(frame, (paste_x, paste_y))
        
    strip.save(output_path, "PNG")
    print(f"Successfully generated horizontal strip: {output_path}")
    print(f"Frame count: {len(frames)}, Frame dimensions: {frame_w}x{frame_h}")
    return {
        "frame_width": frame_w,
        "frame_height": frame_h,
        "total_frames": len(frames)
    }

if __name__ == "__main__":
    assets_dir = "/Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/public/assets"
    brain_dir = "/Users/admin/.gemini/antigravity-ide/brain/db1c3c30-5db4-4249-a605-839bad7ec99f"
    
    # Process Young Rabbit
    young_input = os.path.join(brain_dir, "young_rabbit_sprite_1782148642406.png")
    young_output = os.path.join(assets_dir, "young_rabbit_sprite_clean.png")
    process_grid_to_strip(young_input, young_output, rows=3, cols=4, max_frames=8)
    
    # Process Spirit Rabbit
    spirit_input = os.path.join(brain_dir, "spirit_rabbit_sprite_1782148665598.png")
    spirit_output = os.path.join(assets_dir, "spirit_rabbit_sprite_clean.png")
    process_grid_to_strip(spirit_input, spirit_output, rows=2, cols=4, max_frames=8)
    
    # Process Bunny Girl Child (Stage 4)
    child_input = os.path.join(brain_dir, "bunny_child_sprite_1782148708538.png")
    child_output = os.path.join(assets_dir, "bunny_child_sprite_clean.png")
    process_grid_to_strip(child_input, child_output, rows=2, cols=4, max_frames=8)
    
    # Process Teen Bunny Girl (Stage 5)
    teen_input = os.path.join(brain_dir, "bunny_teen_sprite_1782148726286.png")
    teen_output = os.path.join(assets_dir, "bunny_teen_sprite_clean.png")
    process_grid_to_strip(teen_input, teen_output, rows=2, cols=4, max_frames=8)
    
    # Process Young Woman (Stage 6)
    woman_input = os.path.join(brain_dir, "bunny_woman_sprite_1782148754488.png")
    woman_output = os.path.join(assets_dir, "bunny_woman_sprite_clean.png")
    process_grid_to_strip(woman_input, woman_output, rows=2, cols=3, max_frames=6)
