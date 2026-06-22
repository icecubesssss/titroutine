import os
from PIL import Image

def process_phase1_sprites(input_path, output_path, rows, cols):
    print(f"Processing {input_path}...")
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return False
        
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # 1. Use top-left pixel as background color
    bg_color = img.getpixel((0, 0))
    print(f"Detected background color: {bg_color}")
    
    datas = img.getdata()
    newData = []
    
    # Tolerance for background removal
    tolerance = 20
    
    for item in datas:
        if (abs(item[0] - bg_color[0]) <= tolerance and
            abs(item[1] - bg_color[1]) <= tolerance and
            abs(item[2] - bg_color[2]) <= tolerance):
            newData.append((0, 0, 0, 0)) # transparent
        else:
            newData.append(item)
    img.putdata(newData)
    
    # 2. Divide into grid cells
    cell_w = w // cols
    cell_h = h // rows
    
    frames = []
    
    # Extract each frame
    for r in range(rows):
        for c in range(cols):
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
                frames.append(cropped_cell)
            else:
                # Empty cell, but keep it to maintain grid structure (or keep empty image)
                frames.append(Image.new("RGBA", (1, 1), (0, 0, 0, 0)))
                
    if not frames:
        print("No frames found!")
        return False
        
    # 3. Find max dimensions to create a uniform frame size
    max_w = 0
    max_h = 0
    for frame in frames:
        max_w = max(max_w, frame.width)
        max_h = max(max_h, frame.height)
        
    # Add some padding to avoid clipping
    padding = 10
    frame_w = max_w + padding * 2
    frame_h = max_h + padding * 2
    
    # 4. Stitch frames back into a grid of same rows/cols, but with transparent background and uniform tight frames
    strip_w = frame_w * cols
    strip_h = frame_h * rows
    strip = Image.new("RGBA", (strip_w, strip_h), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        r = i // cols
        c = i % cols
        
        # Bottom-align the cropped frame in its grid slot (so feet touch the ground consistently)
        offset_x = (frame_w - frame.width) // 2
        offset_y = frame_h - frame.height - padding # Bottom aligned with padding
        
        paste_x = c * frame_w + offset_x
        paste_y = r * frame_h + offset_y
        
        strip.paste(frame, (paste_x, paste_y))
        
    strip.save(output_path, "PNG")
    print(f"Successfully generated clean sprite sheet: {output_path}")
    print(f"Grid: {rows} rows, {cols} cols. Frame dimensions: {frame_w}x{frame_h}")
    return {
        "frame_width": frame_w,
        "frame_height": frame_h
    }

if __name__ == "__main__":
    assets_dir = "/Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/titroutine/apps/web/public/assets"
    
    # Process Baby Rabbit Phase 1
    baby_input = os.path.join(assets_dir, "baby_rabbit_phase1.png")
    baby_output = os.path.join(assets_dir, "baby_rabbit_phase1_clean.png")
    process_phase1_sprites(baby_input, baby_output, rows=5, cols=4)
    
    # Process Bunny Child Phase 1
    child_input = os.path.join(assets_dir, "bunny_child_phase1.png")
    child_output = os.path.join(assets_dir, "bunny_child_phase1_clean.png")
    process_phase1_sprites(child_input, child_output, rows=5, cols=4)
