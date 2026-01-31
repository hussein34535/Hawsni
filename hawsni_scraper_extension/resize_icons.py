from PIL import Image
import os

sizes = [(16, "icons/icon16.png"), (48, "icons/icon48.png"), (128, "icons/icon128.png")]
input_path = "icon.png"

if os.path.exists(input_path):
    try:
        img = Image.open(input_path)
        for size, output_path in sizes:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            resized_img.save(output_path)
            print(f"Resized {input_path} to {size}x{size} at {output_path}")
    except Exception as e:
        print(f"Error resizing images: {e}")
else:
    print(f"Input file {input_path} not found.")
