# ReadWorld - Free Online Book Reader

**Live Site:** https://oliviemabl.github.io/

## About

ReadWorld is a free online book reading platform that allows you to read PDF and EPUB books directly in your browser. Features include:

- 📚 Read PDF and EPUB books online
- 🌙 Dark mode and accessibility options
- 📊 Track your reading progress
- ⭐ Bookmark your favorite books
- 📝 Take notes while reading
- 🤖 AI Helper for recommendations
- 📥 Download books in multiple formats

## Testing the Site

Visit https://oliviemabl.github.io/ to test the live site!

The application works entirely client-side using browser storage, so no backend server is required.

## Features

- **Multiple Format Support**: Read both PDF and EPUB books
- **Reading Progress Tracking**: Automatically saves your position
- **Bookmarks & Notes**: Mark important pages and add notes
- **Genre Filtering**: Browse books by genre
- **Search**: Find books by title or author
- **Accessibility**: Color-blind friendly mode and customizable themes
- **Responsive Design**: Works on desktop and mobile devices

## Available Books

The library includes several public domain and free books across various genres:
- Science: Astrophysics for Busy People
- Romance: Bottle Rocket
- Classics: Middlemarch, The Lord of the Rings, A Clockwork Orange
- Adventure: O Livro da Selva (Portuguese)

## Local Development

To run the site locally:

1. Clone this repository
2. Start a local web server in the directory:
   ```bash
   python3 -m http.server 8000
   ```
3. Open http://localhost:8000 in your browser

## Technology

- Pure HTML, CSS, and JavaScript (no build process required)
- Client-side storage using localStorage
- PDF.js for PDF rendering
- ePub.js for EPUB rendering

## Note

This is a static site deployed via GitHub Pages. Authentication features are optional and not required to use the site - all features are available as a guest user.