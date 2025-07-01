# Social Media & Branding Configuration

## Overview

All social media sharing images, favicons, and app icons for Apply are configured to use the official Apply logo hosted on Supabase storage.

## Logo URL

The official Apply logo is hosted at:
```
https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/Apply2025logo.png
```

## Current Configuration

### 1. Favicon & App Icons

**Location**: `index.html`

- **Standard Favicon**: PNG format pointing to Apply logo
- **Apple Touch Icon**: 180x180 pointing to Apply logo
- **MS Application Tile**: Points to Apply logo
- **Theme Color**: `#39FF14` (Apply's neon green)

### 2. Social Media Meta Tags

**Open Graph (Facebook, LinkedIn)**
- Title: "Apply - Agentic Talent Sourcing & Acquisition"
- Description: "Apply revolutionizes recruitment with AI agents that attract and find exceptional talent. The agentic approach to talent sourcing."
- Image: Apply logo (1200x630 recommended)
- Type: website
- URL: https://www.apply.codes/

**Twitter Card**
- Card Type: summary_large_image
- Title: Same as Open Graph
- Description: Same as Open Graph
- Image: Apply logo

### 3. Progressive Web App (PWA)

**Location**: `public/manifest.json`

- **Name**: "Apply - Agentic Talent Sourcing"
- **Short Name**: "Apply"
- **Theme Color**: `#39FF14` (neon green)
- **Background Color**: `#ffffff` (white)
- **Icons**: Multiple sizes (192x192, 512x512, 180x180, 1024x1024) all pointing to Apply logo

### 4. Brand Colors

- **Primary Green**: `#39FF14` (Neon green)
- **Primary Purple**: `#9D4EDD`
- **Secondary Purple**: `#8B5CF6`
- **Text Black**: `#000000`
- **Background White**: `#ffffff`

## Best Practices

### Social Sharing Images

For optimal social media sharing, consider creating dedicated images:

1. **Open Graph Image** (1200x630px)
   - Used by Facebook, LinkedIn, and most social platforms
   - Should include Apply logo, tagline, and visual elements

2. **Twitter Card Image** (1200x600px minimum)
   - Similar to Open Graph but optimized for Twitter's aspect ratio

3. **WhatsApp/Telegram** (300x300px)
   - Square format for messaging apps

### Icon Sizes

Recommended icon sizes for comprehensive device support:

- **16x16** - Browser tabs (small)
- **32x32** - Browser tabs (standard)
- **180x180** - Apple Touch Icon
- **192x192** - Android Chrome
- **512x512** - PWA splash screens

## Implementation Notes

1. All icons and images are served from Supabase storage for consistency
2. The logo URL is used directly without local copies for easier updates
3. Consider adding a local fallback for offline scenarios
4. The manifest.json properly declares icon purposes ("any maskable")

## Testing Tools

To test social media sharing appearance:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Future Recommendations

1. Create dedicated social sharing images with more context than just the logo
2. Add multiple favicon sizes for better device support
3. Consider creating an animated favicon for supported browsers
4. Add structured data (JSON-LD) for better SEO
5. Implement Apple's splash screen images for PWA

## Maintenance

When updating branding:

1. Upload new assets to Supabase storage
2. Update URLs in `index.html` and `manifest.json`
3. Clear CDN caches if applicable
4. Test on all major platforms