import sampleImagesJson from '@/lib/sample-images.json';

export type SampleImageCategory =
  | 'benign_dermatofibroma'
  | 'benign_vascular_lesions'
  | 'pigmented_benign_keratosis'
  | 'malignant_bcc'
  | 'malignant_scc'
  | 'malignant_melanocytic_proliferations';

export type SampleImage = {
  /**
   * Stable unique identifier. We use the ISIC filename stem (e.g. `ISIC_0011865`).
   */
  id: string;
  /**
   * Digits portion of the ISIC id (e.g. `0011865`).
   */
  isicNumber: string;
  category: SampleImageCategory;
  categoryTitle: string;
  /**
   * Public path under Next.js `public/` (e.g. `/sample-images/<category>/<filename>`).
   */
  src: string;
  filename: string;
};

type SampleImageJson = {
  id: string;
  category: string;
  src: string;
  filename: string;
};

const CATEGORY_TITLES: Record<SampleImageCategory, string> = {
  benign_dermatofibroma: 'Benign — Dermatofibroma (DF)',
  benign_vascular_lesions: 'Benign — Vascular lesion (VASC)',
  pigmented_benign_keratosis: 'Benign — Keratosis (BKL)',
  malignant_bcc: 'Malignant — Basal cell carcinoma (BCC)',
  malignant_scc: 'Malignant — Squamous cell carcinoma (SCC)',
  malignant_melanocytic_proliferations: 'Malignant — Melanocytic proliferations (MEL)',
};

export const SAMPLE_CATEGORY_ORDER: SampleImageCategory[] = [
  'malignant_melanocytic_proliferations',
  'malignant_bcc',
  'malignant_scc',
  'pigmented_benign_keratosis',
  'benign_dermatofibroma',
  'benign_vascular_lesions',
];

const extractIsicNumber = (id: string): string => {
  // Accept `ISIC_0011865` or `ISIC-0011865`
  const match = id.match(/^ISIC[_-]?(\d+)$/i);
  return match?.[1] ?? id;
};

const raw = sampleImagesJson as SampleImageJson[];

export const SAMPLE_IMAGES: SampleImage[] = raw.map((img) => {
  const category = img.category as SampleImageCategory;
  return {
    id: img.id,
    isicNumber: extractIsicNumber(img.id),
    category,
    categoryTitle: CATEGORY_TITLES[category] ?? category,
    src: img.src,
    filename: img.filename,
  };
});

export const SAMPLE_IMAGES_BY_CATEGORY: Record<SampleImageCategory, SampleImage[]> =
  SAMPLE_CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = [];
      return acc;
    },
    {} as Record<SampleImageCategory, SampleImage[]>
  );

for (const img of SAMPLE_IMAGES) {
  // If a new category is added to the JSON, ensure it still renders without crashing.
  if (!SAMPLE_IMAGES_BY_CATEGORY[img.category]) {
    console.warn('Unknown sample image category:', img.category);
    continue;
  }
  SAMPLE_IMAGES_BY_CATEGORY[img.category].push(img);
}

export const getSampleImageById = (id: string): SampleImage | undefined => {
  const normalized = id.trim().toUpperCase();
  return SAMPLE_IMAGES.find((img) => img.id.toUpperCase() === normalized);
};

