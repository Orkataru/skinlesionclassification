# SkinTracker Frontend

A Next.js web application for tracking and monitoring skin lesions with AI-powered classification. This frontend integrates with the skin lesion classification backend to provide real-time analysis and visualization.

> ⚠️ **Disclaimer**: This is a research tool and is not approved for clinical diagnosis. Results should not replace professional medical evaluation.

*Originally developed by [@ismailcakmak](https://github.com/ismailcakmak/SkinTracker)*

## Features

### 🔍 AI-Powered Analysis
- Upload or capture skin lesion images for instant classification
- View probability distribution across 8 skin lesion types
- Grad-CAM attention maps showing which regions influenced the AI's decision

### 🗺️ Interactive Body Mapping
- Mark mole locations on an interactive body diagram
- Track changes in specific moles over time
- Easy navigation between recorded lesions

### 📊 Detailed Results
- Visual probability bars for all classification categories
- Confidence indicators with uncertainty warnings
- Educational descriptions for each lesion type

### ⚠️ Safety Features
- Medical disclaimer banner with research tool warnings
- Onboarding modal explaining limitations
- Clear messaging that AI results are not diagnoses

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page with body map
│   │   ├── add-mole/           # Add new mole page
│   │   ├── process/[id]/       # Image processing page
│   │   └── record/[moleId]/[recordId]/  # View record details
│   ├── components/
│   │   ├── CameraView.tsx      # Camera capture component
│   │   ├── Header.tsx          # App header
│   │   ├── HumanBodyViewer.tsx # Interactive body diagram
│   │   ├── MedicalDisclaimer.tsx  # Safety disclaimer banner
│   │   ├── MoleRecord.tsx      # Mole record display
│   │   ├── OnboardingModal.tsx # First-time user guide
│   │   ├── PredictionResult.tsx # AI results visualization
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       ├── api.ts              # Backend API integration
│       ├── camera.ts           # Camera utilities
│       ├── store.ts            # Zustand state management
│       └── utils.ts            # Helper functions
└── public/
    ├── body-front.png          # Body diagram (front)
    └── body-back.png           # Body diagram (back)
```

## API Integration

The frontend connects to the backend API for skin lesion classification. Configure the API URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is part of the ENS492 graduation project at Sabancı University.

## Project Team

- Bilgehan Bilgin
- İsmail Çakmak
