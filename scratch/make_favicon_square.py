from PIL import Image

# Load original logo
img = Image.open('/Users/aditya/Downloads/MindGod/frontend/src/assets/logo.png')

# Create a square image with transparent background (716x716)
max_dim = max(img.width, img.height)
square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))

# Center the original logo in the square image
x_offset = (max_dim - img.width) // 2
y_offset = (max_dim - img.height) // 2
square_img.paste(img, (x_offset, y_offset))

# Save as favicon.png in frontend/public
square_img.save('/Users/aditya/Downloads/MindGod/frontend/public/favicon.png')
print(f"Successfully created square transparent favicon of size: {max_dim}x{max_dim}")
