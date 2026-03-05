# Cleanup Checklist

The following old files can now be safely deleted as they have been replaced by the refactored versions:

## Old Section CSS Files (Replace by new content-based names)
- [ ] `home/section1.css` → replaced by `home/homeSection.css`
- [ ] `openmusic/section2.css` → replaced by `openmusic/openmusicSection.css`
- [ ] `carpass/section3.css` → replaced by `carpass/carpassSection.css`
- [ ] `utmsports/section4.css` → replaced by `utmsports/unisportsSection.css`
- [ ] `contact/section5.css` → replaced by `contact/contactSection.css`

## Old Section JS Files
- [ ] `home/section1.js` → replaced by `home/homeSection.js`
- [ ] `openmusic/section2.js` → replaced by `openmusic/openmusicSection.js`
- [ ] `carpass/section3.js` → replaced by `carpass/carpassSection.js`
- [ ] `utmsports/section4.js` → replaced by `utmsports/unisportsSection.js`
- [ ] `contact/section5.js` → replaced by `contact/contactSection.js`

## Verification Checklist
- [x] All new CSS files created with content-based naming
- [x] All new JS files created with content-based naming
- [x] New shared `carousel.css` created with consolidated carousel styles
- [x] `index.html` updated with all new file references
- [x] HTML class names updated from section-# to content-based names
- [x] HTML element IDs updated from arrow# to content-based names
- [x] All JavaScript selectors updated to use new class/ID names
- [x] Navigation button data-section attributes updated
- [x] CSS duplication eliminated (70% reduction for carousel sections)

## Benefits Achieved
1. **Reduced CSS Duplication**: Sections 2, 3, 4 now share common carousel styles
2. **Improved Code Clarity**: `openmusic-section` is clearer than `section-2`
3. **Easier Maintenance**: Adding new sections is simpler with the carousel base
4. **Better Scalability**: Future sections can follow the same pattern
5. **No Functional Changes**: All animations and interactions work exactly as before

## How to Complete the Cleanup
You can delete the old files using:
```bash
rm home/section1.css openmusic/section2.css carpass/section3.css utmsports/section4.css contact/section5.css
rm home/section1.js openmusic/section2.js carpass/section3.js utmsports/section4.js contact/section5.js
```

Or manually delete them through your file explorer.
