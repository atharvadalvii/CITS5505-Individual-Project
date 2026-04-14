# CITS5505-Individual-Project

A multi-page static web project for CITS5505 covering:

- a beginner-friendly **Tutorial** (HTML, CSS, JavaScript),
- an interactive **Quiz** loaded from JSON via AJAX,
- an **AI Reflection Log** documenting AI-assisted development decisions,
- and a professional-style **CV** page.

The site uses a shared visual system, dark/light theme toggle, responsive layout, and plain HTML/CSS/JavaScript (no framework).

## Live Pages (Local)

- `index.html` - Tutorial page
- `quiz.html` - Quiz page
- `reflection.html` - AI reflection log
- `cv.html` - CV page

## Features

### 1) Tutorial Page
- Structured HTML/CSS/JS learning flow with clear signposting.
- Non-trivial examples and beginner boilerplates.
- Interactive demonstrations:
  - click event demo,
  - live CSS/DOM sandbox.
- Reading mode and persistent study checklist via `localStorage`.

### 2) Quiz Page
- Questions fetched from `data/questions.json` at runtime.
- Questions dynamically rendered and randomized per load (Fisher-Yates).
- Submission validation:
  - blocks incomplete submission,
  - highlights unanswered questions,
  - beforeunload protection when quiz is in progress.
- Score/percentage/pass-fail shown instantly after submit.
- Pass reward fetched from a public API with response validation.
- Attempt history persisted in `localStorage` with clear-history support.

### 3) AI Reflection Log
- Prompt-by-prompt documentation of AI usage.
- Summaries of generated output and manual code changes.
- Decision + verification notes for each case.
- Critical evaluation section identifying subtle AI error and fix.

### 4) CV Page
- Professional CV layout with structured sections.
- Contact details, skills, experience, certifications, and references.
- Responsive design consistent with site-wide visual identity.

## Tech Stack

- **HTML5**
- **CSS3** (custom properties, responsive layout, dark mode tokens)
- **Vanilla JavaScript** (DOM APIs, fetch, localStorage)

## Project Structure

```text
cits5505-project/
├── index.html
├── quiz.html
├── reflection.html
├── cv.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── theme.js
│   ├── tutorial.js
│   ├── quiz.js
│   ├── storage.js
│   ├── api.js
│   └── reflection.js
├── data/
│   └── questions.json
└── assets/
    └── images/
        └── profile.png
```

## Run Locally

Because the quiz uses `fetch()` for `data/questions.json`, run the project via HTTP (not `file://`):

```bash
cd /Users/atharva/Desktop/cits5505-project
python3 -m http.server 8000
```

Open in browser:

- [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html)
- [http://127.0.0.1:8000/quiz.html](http://127.0.0.1:8000/quiz.html)
- [http://127.0.0.1:8000/reflection.html](http://127.0.0.1:8000/reflection.html)
- [http://127.0.0.1:8000/cv.html](http://127.0.0.1:8000/cv.html)

## Notes

- Theme preference is persisted in browser storage.
- Quiz attempts are stored per browser profile/device (`localStorage`).
- Public API failures are handled gracefully with fallback messaging.
