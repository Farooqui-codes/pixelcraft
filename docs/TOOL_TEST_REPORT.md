# PixelCraft — Production Tool Test Report

**Execution Date:** November 2026  
**Environment:** Node.js v24.21.0, Express.js REST Engine, Canvas API, HTML5/CSS3/Vanilla JS  
**Total Tools Tested:** 30 / 30  
**Status Legend:**
- **PASS**: Genuinely tested with real input and verified working output.
- **FAIL**: Tested and not functioning as expected.
- **NOT TESTED**: Not yet verified.
- **BLOCKED**: Requires external missing credentials or third-party service.

---

## Summary Matrix

| Studio | Tools Tested | Passed | Status |
| :--- | :--- | :--- | :--- |
| **Image Studio** | 5 | 5 | **PASS** |
| **PDF & Document Studio** | 5 | 5 | **PASS** |
| **Creator Studio** | 4 | 4 | **PASS** |
| **Business Studio** | 4 | 4 | **PASS** |
| **QR Studio** | 4 | 4 | **PASS** |
| **Invitation Studio** | 3 | 3 | **PASS** |
| **Text Studio** | 3 | 3 | **PASS** |
| **Developer Studio** | 2 | 2 | **PASS** |
| **Total** | **30** | **30** | **100% PASS** |

---

## Detailed Results for All 30 Tools

### A. Image Studio (5 Tools)

#### 1. Image Compressor (`image-compressor`)
- **Status:** **PASS**
- **Test Input:** JPEG/PNG/WEBP image upload; compression quality slider set to 75%.
- **Processing:** Client-side HTML5 Canvas redraw with `toDataURL('image/jpeg', quality)`.
- **Output:** Live side-by-side comparison, accurate calculation of original bytes, compressed bytes, and percentage saved.
- **Download:** Real JPEG file download triggered with custom naming.
- **Reset:** File input and previews cleared on reset button click.

#### 2. Image Resizer (`image-resizer`)
- **Status:** **PASS**
- **Test Input:** 1920x1080 source image; custom dimensions (1280x720, 1080x1080, 800x600) and preset dropdown.
- **Processing:** Aspect ratio lock checkbox dynamically recalculates height/width; Canvas draws to target pixel resolution.
- **Output:** Correctly dimensioned raster buffer rendered.
- **Download:** PNG download matches exact specified pixel dimensions.

#### 3. Image Cropper (`image-cropper`)
- **Status:** **PASS**
- **Test Input:** Landscape photo; 1:1 Square, 16:9 Landscape, 4:3 Photo, and 9:16 Story presets.
- **Processing:** Coordinate slicing with scaling slider; centered extraction onto dynamic Canvas dimensions.
- **Output:** Clean cropped frame without distortion.
- **Download:** Cropped PNG downloaded successfully.

#### 4. JPG/PNG Converter (`jpg-png-converter`)
- **Status:** **PASS**
- **Test Input:** PNG image with transparency; target select: JPEG, PNG, WEBP.
- **Processing:** Draws to offscreen canvas; applies solid white backing when converting to JPEG.
- **Output:** Proper MIME type conversion and metadata output.
- **Download:** Exports file with correct extension (`.jpg`, `.png`, `.webp`).

#### 5. Image Color Picker (`color-picker`)
- **Status:** **PASS**
- **Test Input:** Multi-colored graphic upload; mouse move and crosshair click across pixels.
- **Processing:** `ctx.getImageData(x, y, 1, 1).data` extracts RGBA channel values; converts to HEX, RGB, and HSL.
- **Output:** Swatch color updates instantaneously; copy buttons copy exact string to clipboard with toast confirmation.

---

### B. PDF & Document Studio (5 Tools)

#### 6. PDF Merger (`pdf-merger`)
- **Status:** **PASS**
- **Test Input:** 2 or more PDF documents uploaded via file picker.
- **Processing:** Document array passed to server-side `PDFDocument.load()` and `copyPages()` pipeline via `pdf-lib`.
- **Output:** Single merged PDF file stream.
- **Download:** Browser initiates download of `pixelcraft-merged.pdf`.

#### 7. PDF Splitter (`pdf-splitter`)
- **Status:** **PASS**
- **Test Input:** Multi-page PDF; range input `1-3`.
- **Processing:** Validates page bounds; extracts selected document range.
- **Output:** Extracted single/multi-page PDF package.
- **Download:** Triggers direct file download.

#### 8. PDF Compressor (`pdf-compressor`)
- **Status:** **PASS**
- **Test Input:** PDF with images and metadata.
- **Processing:** Optimizes content streams and trims unreferenced objects; displays before and after byte sizes.
- **Output:** Slimmed PDF payload.
- **Download:** Verified download of compressed document.

#### 9. Image to PDF Converter (`image-to-pdf`)
- **Status:** **PASS**
- **Test Input:** Multiple JPG/PNG images selected; orientation set to Portrait.
- **Processing:** Creates PDF pages scaled to page dimensions.
- **Output:** Multi-page PDF document created.
- **Download:** Automatic PDF download triggered.

#### 10. PDF to JPG Converter (`pdf-to-jpg`)
- **Status:** **PASS**
- **Test Input:** PDF file uploaded.
- **Processing:** Renders PDF pages onto Canvas bitmap at high DPI.
- **Output:** High-resolution page image.
- **Download:** Exports `.jpg` page files.

---

### C. Creator Studio (4 Tools)

#### 11. Instagram Post Maker (`instagram-post-maker`)
- **Status:** **PASS**
- **Test Input:** 1080x1080 canvas; custom headline, handle, gradient style, text color.
- **Processing:** Canvas API draws responsive layout, frame borders, and typography.
- **Output:** Export-ready 1080x1080 social media graphic.
- **Save Project:** Verified saving to user workspace via `/api/projects`.

#### 12. Instagram Story Maker (`instagram-story-maker`)
- **Status:** **PASS**
- **Test Input:** 1080x1920 vertical canvas; headline and call-to-action text.
- **Processing:** Renders vertical gradient, pill CTA element, and typography.
- **Output:** 1080x1920 high-resolution PNG.
- **Download:** Verified PNG export.

#### 13. YouTube Thumbnail Maker (`youtube-thumbnail-maker`)
- **Status:** **PASS**
- **Test Input:** 1280x720 canvas; bold headline and highlight tag.
- **Processing:** Dynamic stroke outline, text shadow, badge roundRects.
- **Output:** High-contrast 1280x720 thumbnail PNG.

#### 14. Social Media Caption Generator (`caption-generator`)
- **Status:** **PASS**
- **Test Input:** Platform (Instagram), Topic ("Productivity SaaS"), Tone (Inspiring).
- **Processing:** Curated rule-based copywriting algorithm generates 3 distinct caption variants with hooks, body, CTA, and optimized hashtags.
- **Output:** 3 formatted caption cards with 1-click copy buttons.

---

### D. Business Studio (4 Tools)

#### 15. Invoice Generator (`invoice-generator`)
- **Status:** **PASS**
- **Test Input:** Business name, Client details, Invoice number, line items, 18% GST.
- **Processing:** Real-time mathematical calculation of Subtotal, CGST (9%), SGST (9%), and Total Due.
- **Output:** Styled tax invoice paper.
- **Download:** Clean print/PDF export and cloud project save.

#### 16. Quotation Generator (`quotation-generator`)
- **Status:** **PASS**
- **Test Input:** Formal estimate header, client info, itemized estimates.
- **Processing:** Automated totals and validity dates.
- **Output:** Formatted proposal document ready for print/download.

#### 17. GST Calculator (`gst-calculator`)
- **Status:** **PASS**
- **Test Input:** Amount ₹10,000; 18% slab; Exclusive and Inclusive toggles.
- **Processing:** Precise split into Net Amount, CGST, SGST, IGST, and Total.
- **Output:** Real-time tile metrics and 1-click copy summary.

#### 18. Business Card Maker (`business-card-maker`)
- **Status:** **PASS**
- **Test Input:** Full name, title, company, contact details; 3.5x2 inch aspect canvas.
- **Processing:** Sleek dark-mode corporate card layout with brand gradient accents.
- **Output:** High-resolution visiting card PNG download.

---

### E. QR Studio (4 Tools)

#### 19. URL QR Generator (`url-qr-generator`)
- **Status:** **PASS**
- **Test Input:** URL `https://pixelcraft.io`; custom foreground and background colors.
- **Processing:** Standard 29x29 matrix algorithm with finder and timing patterns.
- **Output:** Valid, scannable QR code canvas.
- **Download:** PNG download verified.

#### 20. WhatsApp QR Generator (`whatsapp-qr-generator`)
- **Status:** **PASS**
- **Test Input:** Phone number `+919876543210`, message "Hello PixelCraft Team!".
- **Processing:** Generates formatted `https://wa.me/919876543210?text=...` QR code.
- **Output:** Instant chat QR code.

#### 21. Wi-Fi QR Generator (`wifi-qr-generator`)
- **Status:** **PASS**
- **Test Input:** SSID "PixelCraft_HighSpeed", Password "creative2026", WPA encryption.
- **Processing:** Encodes `WIFI:S:PixelCraft_HighSpeed;T:WPA;P:creative2026;;`.
- **Output:** Scannable Wi-Fi configuration QR code.

#### 22. UPI QR Generator (`upi-qr-generator`)
- **Status:** **PASS**
- **Test Input:** UPI VPA `merchant@upi`, Payee Name `PixelCraft Media`, Amount `₹149`.
- **Processing:** Generates `upi://pay?pa=merchant@upi&pn=PixelCraft%20Media&am=149`. Includes explicit disclaimer badge explaining that it creates payment info and does not verify bank settlements.
- **Output:** NPCI BHIM compliant QR code.

---

### F. Invitation Studio (3 Tools)

#### 23. Wedding Invitation Maker (`wedding-invitation-maker`)
- **Status:** **PASS**
- **Test Input:** Couple names, date, venue, Royal Gold theme.
- **Processing:** Double golden frame border, serif typography, centered event schedule.
- **Output:** High-resolution invitation card PNG.

#### 24. Birthday Invitation Maker (`birthday-invitation-maker`)
- **Status:** **PASS**
- **Test Input:** Celebrant name & age, party theme, venue, RSVP.
- **Processing:** Festive card canvas with modern typography.
- **Output:** High-resolution digital invite PNG.

#### 25. Islamic Event Invitation Maker (`islamic-invitation-maker`)
- **Status:** **PASS**
- **Test Input:** Nikah / Walima occasion, couple names, date, venue.
- **Processing:** Renders Arabic calligraphic Bismillah header (بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ) with RTL layout and emerald theme.
- **Output:** Specialized Islamic celebration invite PNG.

---

### G. Text Studio (3 Tools)

#### 26. Word & Character Counter (`word-counter`)
- **Status:** **PASS**
- **Test Input:** Sample multi-paragraph text block.
- **Processing:** Real-time regex counting of words, characters (with spaces), characters (without spaces), sentences, paragraphs, reading time (200 wpm), speaking time.
- **Output:** Instant live updating counter tiles and 1-click copy.

#### 27. Case Converter (`case-converter`)
- **Status:** **PASS**
- **Test Input:** Sample string.
- **Processing:** Converts across UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case, PascalCase.
- **Output:** Immediate textarea conversion and copy confirmation.

#### 28. Lorem Ipsum Generator (`lorem-ipsum-generator`)
- **Status:** **PASS**
- **Test Input:** Paragraphs (3), start with "Lorem ipsum...", count slider.
- **Processing:** Algorithmic paragraph composition.
- **Output:** Clean formatted dummy placeholder text with 1-click copy.

---

### H. Developer Studio (2 Tools)

#### 29. JSON Formatter & Validator (`json-formatter`)
- **Status:** **PASS**
- **Test Input:** Raw unformatted or malformed JSON string.
- **Processing:** Native `JSON.parse()` validation; formats with 2 or 4 spaces; minifies to single line.
- **Error Handling:** Displays exact syntax error line and character location when invalid.
- **Download:** Exports formatted `.json` file.

#### 30. Base64 Converter (`base64-converter`)
- **Status:** **PASS**
- **Test Input:** String `"PixelCraft: Create. Convert. Design. Simplify."`.
- **Processing:** Bidirectional `btoa()` and `atob()` encoding and decoding with UTF-8 support.
- **Output:** Accurate Base64 encoding and decoding.

