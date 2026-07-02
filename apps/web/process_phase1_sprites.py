import os
from PIL import Image

def process_phase1_sprites(input_path, output_path, rows, cols, tolerance=20):
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
    # Raw source sheets (Gemini output) live OUTSIDE public/ so they are not
    # shipped to the web; only the processed _clean/_processed sheets are served.
    base = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base, "sprite-src")
    assets_dir = os.path.join(base, "public/assets")

    # Process Baby Rabbit Phase 1
    baby_input = os.path.join(src_dir, "baby_rabbit_phase1.png")
    baby_output = os.path.join(assets_dir, "baby_rabbit_phase1_clean.png")
    process_phase1_sprites(baby_input, baby_output, rows=5, cols=4)
    
    # Process Bunny Child Phase 1
    child_input = os.path.join(src_dir,"bunny_child_phase1.png")
    child_output = os.path.join(assets_dir, "bunny_child_phase1_clean.png")
    process_phase1_sprites(child_input, child_output, rows=5, cols=4)

    # Process Bunny Child Phase 2 Morning
    morning_input = os.path.join(src_dir,"bunny_child_phase2_morning.png")
    morning_output = os.path.join(assets_dir, "bunny_child_phase2_morning_clean.png")
    process_phase1_sprites(morning_input, morning_output, rows=3, cols=4)

    # Process Bunny Child Phase 2 Study
    study_input = os.path.join(src_dir,"bunny_child_phase2_study.png")
    study_output = os.path.join(assets_dir, "bunny_child_phase2_study_clean.png")
    process_phase1_sprites(study_input, study_output, rows=3, cols=4)

    # Process Bunny Child Phase 2 Extra
    extra_input = os.path.join(src_dir,"bunny_child_phase2_extra.png")
    extra_output = os.path.join(assets_dir, "bunny_child_phase2_extra_processed.png")
    process_phase1_sprites(extra_input, extra_output, rows=5, cols=4)

    # Process Phase 3
    egg_input = os.path.join(src_dir,"egg_phase3.png")
    egg_output = os.path.join(assets_dir, "egg_phase3_clean.png")
    process_phase1_sprites(egg_input, egg_output, rows=3, cols=4)

    young_spirit_input = os.path.join(src_dir,"young_spirit_rabbit_phase3.png")
    young_spirit_output = os.path.join(assets_dir, "young_spirit_rabbit_phase3_clean.png")
    process_phase1_sprites(young_spirit_input, young_spirit_output, rows=3, cols=4)

    teen_input = os.path.join(src_dir,"teen_bunny_girl_phase3.png")
    teen_output = os.path.join(assets_dir, "teen_bunny_girl_phase3_clean.png")
    process_phase1_sprites(teen_input, teen_output, rows=3, cols=4)

    woman_input = os.path.join(src_dir,"young_woman_bunny_phase3.png")
    woman_output = os.path.join(assets_dir, "young_woman_bunny_phase3_clean.png")
    process_phase1_sprites(woman_input, woman_output, rows=3, cols=4)

    # Process Phase 4
    interaction_input = os.path.join(src_dir,"user_interaction_phase4.png")
    interaction_output = os.path.join(assets_dir, "user_interaction_phase4_clean.png")
    process_phase1_sprites(interaction_input, interaction_output, rows=3, cols=4)

    streaks_input = os.path.join(src_dir,"streaks_milestone_phase4.png")
    streaks_output = os.path.join(assets_dir, "streaks_milestone_phase4_clean.png")
    process_phase1_sprites(streaks_input, streaks_output, rows=4, cols=4)

    # Process Phase 5
    weather_input = os.path.join(src_dir,"weather_seasons_phase5.png")
    weather_output = os.path.join(assets_dir, "weather_seasons_phase5_clean.png")
    process_phase1_sprites(weather_input, weather_output, rows=3, cols=4)

    festivals_input = os.path.join(src_dir,"festivals_phase5.png")
    festivals_output = os.path.join(assets_dir, "festivals_phase5_clean.png")
    process_phase1_sprites(festivals_input, festivals_output, rows=3, cols=4)

    # Process Phase 6
    rare1_input = os.path.join(src_dir,"rare_events_1_phase6.png")
    rare1_output = os.path.join(assets_dir, "rare_events_1_phase6_clean.png")
    process_phase1_sprites(rare1_input, rare1_output, rows=3, cols=4)

    rare2_input = os.path.join(src_dir,"rare_events_2_phase6.png")
    rare2_output = os.path.join(assets_dir, "rare_events_2_phase6_clean.png")
    process_phase1_sprites(rare2_input, rare2_output, rows=3, cols=4)

    # Full-emotion action sheets for stages 2/3/5/6 (Gemini G1/G2) — 4 cols x 5 rows
    # (rows: idle, happy, sad, sleep, study). Plus stage-6 outfit sheets (G4, same layout).
    action_and_outfit = [
        "young_rabbit_actions", "spirit_rabbit_actions",
        "bunny_teen_actions", "bunny_woman_actions",
        "outfit_summer_dress_sprite", "outfit_winter_coat_sprite", "outfit_chef_sprite",
    ]
    for name in action_and_outfit:
        inp = os.path.join(src_dir, f"{name}.png")
        out = os.path.join(assets_dir, f"{name}_clean.png")
        # Higher tolerance: the neon-green backdrop leaves a green fringe/glow at
        # tol=20 (esp. spirit_rabbit, whose aura is green). ~72 eats it; the cream/
        # purple characters are far enough from neon-green to stay intact.
        process_phase1_sprites(inp, out, rows=5, cols=4, tolerance=72)
