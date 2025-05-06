# Bluesky Post Assistant

A web application designed to help users draft, refine, and share posts on the Bluesky social media platform. This tool leverages built-in AI APIs (`Writer` and `Rewriter`) to generate initial drafts from prompts and then allows users to iteratively refine the text by adjusting tone, format, and length.

## Features

- **Prompt-based Draft Generation**: Enter a prompt to generate an initial post draft.
- **Iterative Refinement**: Refine generated posts by changing:
  - **Tone**: (e.g., As Is, More Formal, More Casual)
  - **Format**: (e.g., As Is, Plain Text, Markdown)
  - **Length**: (e.g., As Is, Shorter, Longer)
- **Post History**: View a history of all generated and refined posts. Each entry in the history can be further refined or shared.
- **Character Count**: Real-time character count for each post, with a visual indicator for Bluesky's 300-character limit.
- **Direct Sharing**: Share posts directly to Bluesky via a pre-filled compose intent URL.
- **Stylish UI**: A modern, clean, and responsive user interface.
- **Toast Notifications**: Non-intrusive status messages for API calls and other actions.

## Tech Stack

- HTML5
- CSS3 (with modern styling, including Google Fonts)
- JavaScript (ES Modules)
- Vite (for development server and build process)
- Built-in AI APIs (`Writer` and `Rewriter` - assumed to be available in the browser environment)

## Project Structure

```
/
├── public/
│   └── vite.svg
├── src/
│   ├── main.js         # Main application logic, API interactions, DOM manipulation
│   ├── style.css       # All CSS styles for the application
│   └── counter.js      # (Potentially unused example file from Vite starter)
│   └── javascript.svg  # (Potentially unused example file from Vite starter)
├── .gitignore
├── index.html          # Main HTML entry point
├── package.json        # Project dependencies and scripts
├── package-lock.json
└── README.md           # This file
```

## Setup and Installation

This project uses Node.js and npm for dependency management and running development scripts.

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Navigate to the project directory:**
    ```bash
    cd path/to/bluesky-poster
    ```
3.  **Install dependencies:**
    This project relies on Vite. If `package.json` lists development dependencies like Vite, run:
    ```bash
    npm install
    ```
    If there are no external npm dependencies other than what Vite provides by default for a vanilla JS project, this step might primarily set up Vite's environment.

## Running the Application

### Using Vite Development Server (Recommended)

The Vite development server provides features like Hot Module Replacement (HMR) for a better development experience.

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173` or similar).

### Opening `index.html` Directly

You can also open the `index.html` file directly in your web browser. However, some features related to module loading or development-specific configurations might work best when served through Vite.

## How It Works

The application uses JavaScript to handle user interactions:

- **Generating Drafts**: Takes the user's prompt, calls the `Writer` API, and displays the generated text in a new post entry.
- **Refining Posts**: When a user clicks "Refine" on a post, a modal appears allowing them to select new tone, format, and length parameters. These are then sent with the original text to the `Rewriter` API. The refined text is displayed as a new post entry.
- **History**: Each generated or refined post is added to a scrollable history, allowing users to track changes and revisit previous versions.
- **Sharing**: The "Share on Bluesky" button opens a new tab with Bluesky's compose intent URL, pre-filled with the post text.

The application checks for the availability of the `Writer` and `Rewriter` global objects upon loading and updates the UI accordingly.
