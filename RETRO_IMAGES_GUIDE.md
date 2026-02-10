# Retro Australian Tradesman Images Guide

This guide explains where to place your 1960s-1970s Australian tradesman images with classic Holdens and Fords.

## Image Requirements

### Style Guidelines
- **Era**: 1960s-1970s Australian aesthetic
- **Vehicles**: Classic Holden utes, Ford utes, vintage work vans
- **Characters**: Authentic Aussie tradesmen in period-appropriate work gear
- **Color Palette**: Warm, vintage tones with slight fading effect
- **Mood**: Nostalgic, hardworking, authentic Australian blue-collar

### Image Specifications

#### 1. Hero Image (Main Homepage)
- **File**: `/public/images/hero-retro-tradesman.jpg`
- **Dimensions**: 1200x1000px (landscape)
- **Description**: Wide shot of tradesman with classic Holden or Ford ute, tools visible
- **Suggested Prompt**: "1970s Australian tradesman standing next to orange Holden HQ ute, tool belt, suburban Sydney street, warm vintage colors, photorealistic"

#### 2. How It Works Section
- **File**: `/public/images/how-it-works-1.jpg` (Optional)
- **Dimensions**: 800x600px
- **Description**: Tradesman shaking hands with client
- **Suggested Prompt**: "1960s Australian plumber shaking hands with homeowner, vintage Ford Falcon van in background, friendly interaction, retro film grain"

#### 3. Services Background (Optional)
- **File**: `/public/images/services-bg.jpg`
- **Dimensions**: 1920x600px (wide banner)
- **Description**: Multiple tradies working on a job site
- **Suggested Prompt**: "1970s Australian construction site, multiple tradesmen working, classic Holden Kingswood utes, vintage tools, golden hour lighting"

#### 4. Testimonials Background (Optional)
- **File**: `/public/images/testimonials-bg.jpg`
- **Dimensions**: 1200x400px
- **Description**: Happy tradesman with completed project
- **Suggested Prompt**: "1960s Australian electrician smiling at camera, finished house wiring, vintage work clothes, classic Ford ute, achievement mood"

## AI Image Generation Prompts

### Recommended Tools
- **Midjourney**: Best for vintage/retro aesthetics
- **DALL-E 3**: Good for specific Australian context
- **Stable Diffusion**: With vintage film photography models

### Base Prompt Template
```
[Trade type] Australian tradesman in [decade], [action], [vehicle make/model],
[setting], vintage photography, warm tones, slight film grain, authentic period
details, professional quality, photorealistic
```

### Example Prompts

**Electrician with Holden**:
```
1970s Australian electrician working on power box, orange Holden HQ ute parked
nearby, tool belt with vintage tools, suburban Melbourne street, warm afternoon
light, vintage Kodak film aesthetic, photorealistic, detailed
```

**Plumber with Ford**:
```
1960s Australian plumber carrying copper pipes, baby blue Ford Falcon ute,
vintage work shirt and overalls, Brisbane suburban home, golden hour lighting,
retro film grain, authentic period details
```

**Carpenter with Tools**:
```
1970s Australian carpenter at workbench, red Holden Sandman van, timber and
tools, workshop setting, vintage color grading, professional photography,
nostalgic mood
```

## Implementation Instructions

### Step 1: Generate Images
1. Use the prompts above with your preferred AI image generator
2. Aim for consistent vintage color palette across all images
3. Ensure high resolution (at least 1200px width for hero images)

### Step 2: Place Images in Project
1. Save generated images to `/public/images/` directory
2. Use the exact filenames specified above
3. Optimize images for web (compress while maintaining quality)

### Step 3: Update Code (if needed)
The homepage currently shows a placeholder for the hero image. To activate your image:

**Current code** (line 67-76 in `app/page.tsx`):
```tsx
<div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
  {/* Placeholder for retro Aussie tradesman image */}
  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-blue-500">
    ...placeholder text...
  </div>
</div>
```

**Replace with**:
```tsx
<div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
  <Image
    src="/images/hero-retro-tradesman.jpg"
    alt="Classic Australian Tradesman"
    fill
    className="object-cover"
    priority
  />
</div>
```

### Step 4: Optional Enhancements
Add vintage filter overlay for extra authenticity:
```tsx
<div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
  <Image
    src="/images/hero-retro-tradesman.jpg"
    alt="Classic Australian Tradesman"
    fill
    className="object-cover"
    priority
  />
  {/* Vintage overlay */}
  <div className="absolute inset-0 bg-orange-900/10 mix-blend-multiply" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
</div>
```

## Additional Image Opportunities

### Category Icons
Create vintage-style icons for each trade category:
- Plumber with wrench (1960s style)
- Sparky with test meter (retro design)
- Chippy with saw (classic tools)

### Background Patterns
Subtle retro patterns:
- Blueprint-style technical drawings
- Vintage tool silhouettes
- Classic car blueprints

## Tips for Authentic Look

1. **Color Palette**: Use warm, slightly faded colors (browns, oranges, creams)
2. **Film Grain**: Add subtle grain for vintage photo effect
3. **Vehicles**: Stick to popular Aussie models:
   - Holden HQ, HJ, HZ utes
   - Ford Falcon XA, XB, XC utes
   - Holden Kingswood panel vans
4. **Clothing**: Period-appropriate work wear:
   - King Gee work shirts
   - Stubbies shorts
   - Blundstone boots
   - Wide-brimmed hats
5. **Settings**: Typical Aussie suburbs:
   - Brick veneer homes
   - Hills Hoist clotheslines
   - Corrugated iron roofs

## Resources

### Color References
- **Primary Orange**: #FF9800 (matches AnyTrade brand)
- **Vehicle Colors**: Burnt orange, baby blue, avocado green, mustard yellow
- **Background Tones**: Warm beiges, soft browns

### Australian Trade References
- Research "Australian tradesmen 1960s-1970s" on vintage photo archives
- Look at National Film and Sound Archive of Australia
- Check Trove (National Library of Australia) for period images

## Questions?

If you need help with image placement or have questions about the retro theme,
refer to the HiPages website for modern layout inspiration while maintaining
the vintage Australian aesthetic for imagery.
