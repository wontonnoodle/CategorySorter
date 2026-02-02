# Category Organizer

A standalone web application for managing hierarchical categories and subcategories with drag-and-drop reordering, inline editing, and persistent storage. 

## Features

- **Drag-and-drop reordering** of categories and subcategories (powered by Sortable.js)
- **Move subcategories** between categories
- **Inline editing** — click any name to edit, press Enter to save, Escape to cancel
- **Add/delete** categories and subcategories
- **Persistent storage** via browser localStorage (auto-saved with 500ms debounce)
- **Responsive** layout for desktop and mobile

## Getting Started

Open `index.html` in a web browser. No build step or server is required.

The app loads with example data on first use. All changes are saved automatically to `localStorage`.

## File Structure

```
category-organizer/
├── index.html   # Main page
├── app.js       # Application logic
├── styles.css   # Styling
└── README.md    # This file
```

## Tech Stack

- Pure HTML / CSS / JavaScript (no frameworks)
- [Sortable.js](https://github.com/SortableJS/Sortable) for drag-and-drop (loaded via CDN)
- `localStorage` for data persistence
- `crypto.randomUUID()` for ID generation

## Data Format

Data is stored under the `categoryOrganizerData` key in localStorage:

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "order": 0,
      "subcategories": [
        { "id": "uuid", "name": "Subcategory Name", "order": 0 }
      ]
    }
  ]
}
```

## Browser Support

Requires a modern browser with support for `crypto.randomUUID()`, `localStorage`, and ES5+.
