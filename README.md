# PixelCraft — Production Full-Stack Creative SaaS Platform

> **Brand Name:** PixelCraft  
> **Tagline:** Create. Convert. Design. Simplify.  
> **Lead Engineers:** Farooqui Umair & Sayed Shaad  

PixelCraft is an all-in-one online creative productivity SaaS web platform where users can create, edit, convert, organize, and download digital content across 30 production tools.

---

## 🚀 Key Highlights & Architectural Strengths

- **No Frontend Frameworks / Zero Bloat:** Built with pure HTML5, CSS3, and ES6+ Vanilla JavaScript. Ultra-fast initial load with zero client-side framework overhead.
- **30 Functional Production Tools:** Spanning 8 dedicated studios with real inputs, real Canvas API manipulation, real QR matrix generation, real GST/tax calculations, and instant downloads.
- **20 Essential SaaS UX Patterns:** Command Palette (Ctrl+K), Optimistic UI updates, Skeleton loaders, Autosave, Debouncing, Throttling, Destructive action protection, Reusable data tables, and Tier-based indicators.
- **Dual-Storage Engine:** Connects seamlessly to **Supabase PostgreSQL** with Row Level Security (RLS) when configured in `.env`, and includes an out-of-the-box zero-config high-reliability local persistent store for instant local execution.
- **User Workspace & Admin Console:** Real authentication with bcrypt hashing and JWT tokens, user isolation, cloud project storage, favorites, and a secure admin control center.

---

## 🛠️ The 30 Production Tools (8 Studios)

### 1. Image Studio (5 Tools)
- **Image Compressor:** Custom quality slider (1-100%), side-by-side comparison, real-time byte calculation, and download.
- **Image Resizer:** Custom pixel dimensions, aspect ratio lock, and standard social media presets.
- **Image Cropper:** Interactive visual crop with 1:1, 16:9, 4:3, and 9:16 presets.
- **JPG/PNG Converter:** Convert between PNG, JPG, and WEBP formats.
- **Image Color Picker:** Interactive eyedropper loupe extracting HEX, RGB, and HSL color values with 1-click copy.

### 2. PDF & Document Studio (5 Tools)
- **PDF Merger:** Combine multiple PDF documents into an ordered single file.
- **PDF Splitter:** Extract page ranges or specific pages from any PDF.
- **PDF Compressor:** Content stream optimization and metadata slimming.
- **Image to PDF Converter:** Convert single or multiple images into a clean PDF.
- **PDF to JPG Converter:** High-resolution page rasterization and JPG export.

### 3. Creator Studio (4 Tools)
- **Instagram Post Maker:** 1080x1080 canvas, custom typography, frames, gradients, and project saving.
- **Instagram Story Maker:** 1080x1920 vertical canvas with call-to-action elements.
- **YouTube Thumbnail Maker:** 1280x720 canvas with text outline strokes and badges.
- **Social Media Caption Generator:** Rule-based copywriting generator tailored by niche, platform, and tone.

### 4. Business Studio (4 Tools)
- **Invoice Generator:** Professional tax invoices with line items, automated subtotal/GST, and print/PDF export.
- **Quotation Generator:** Formal commercial estimates and price proposals.
- **GST Calculator:** Exact CGST, SGST, IGST split with inclusive and exclusive modes.
- **Business Card Maker:** Standard 3.5x2 inch visiting cards with custom branding.

### 5. QR Studio (4 Tools)
- **URL QR Generator:** Scannable website QR codes with custom colors.
- **WhatsApp QR Generator:** Direct chat links with pre-filled messages.
- **Wi-Fi QR Generator:** Encodes network SSID and WPA/WEP passwords for instant guest access.
- **UPI QR Generator:** NPCI BHIM compliant payment QR codes with standard UPI URIs.

### 6. Invitation Studio (3 Tools)
- **Wedding Invitation Maker:** Luxury templates with couple names, date, venue, and golden borders.
- **Birthday Invitation Maker:** Fun party cards with customizable details.
- **Islamic Event Invitation Maker:** Nikah and Walima announcements featuring calligraphic Arabic Bismillah and RTL layout support.

### 7. Text Studio (3 Tools)
- **Word & Character Counter:** Real-time count of words, characters, sentences, paragraphs, and reading time.
- **Case Converter:** Transform text into UPPERCASE, lowercase, Title Case, camelCase, snake_case, etc.
- **Lorem Ipsum Generator:** Custom placeholder text by paragraphs, sentences, or words.

### 8. Developer Studio (2 Tools)
- **JSON Formatter & Validator:** Prettify with 2 or 4 spaces, minify, and locate syntax errors.
- **Base64 Encoder & Decoder:** Bidirectional encoding and decoding for strings and data URIs.

---

## 💻 Tech Stack

- **Frontend:** HTML5, CSS3 (Custom design tokens, Dark/Light modes), Vanilla JavaScript (ES6+), HTML5 Canvas API, Fetch API, Font Awesome 6.
- **Backend:** Node.js, Express.js REST API, JSON Web Tokens (JWT), bcryptjs, multer, express-rate-limit, pdf-lib, qrcode.
- **Database & RLS:** Supabase PostgreSQL with Row Level Security policies (`database/schema.sql` & `database/policies.sql`) + local zero-config fallback engine.

---

## 📦 Installation & Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: PixelCraft works 100% out-of-the-box even without Supabase keys using its built-in local persistent store. To connect live Supabase, simply enter your `SUPABASE_URL` and `SUPABASE_KEY` in `.env`).*

### 3. Start the Server
```bash
npm start
```
Open your browser and visit:  
**`http://localhost:3000`**

### 4. Run Automated Test Suite
```bash
npm test
```
Executes 27 automated assertions verifying all 30 tools, authentication, user isolation, project CRUD, and admin security.

---

## 👥 Meet the Developers

PixelCraft was designed and developed by:
- **Farooqui Umair** — Full-Stack Engineer (umair@pixelcraft.io)
- **Sayed Shaad** — Full-Stack Engineer (shaad@pixelcraft.io)

---

## 📄 License
PixelCraft is proprietary SaaS software. All rights reserved &copy; 2026 PixelCraft Technologies.

