import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MoleLocation = {
  x: number;
  y: number;
};

export type MoleRecord = {
  id: string;
  image: string; // Base64 encoded image
  date: string;
  prediction: number;
  maxConfidence: number;
  probabilities: number[];
  gradcam?: string; // Base64 encoded Grad-CAM heatmap
};

export type Mole = {
  id: string;
  location: MoleLocation;
  records: MoleRecord[];
};

type MoleStore = {
  moles: Mole[];
  addMole: (mole: Mole) => void;
  addMoleRecord: (moleId: string, record: MoleRecord) => void;
  getMole: (id: string) => Mole | undefined;
  getMoleByLocation: (x: number, y: number, threshold: number) => Mole | undefined;
  cleanupOldRecords: () => void;
};

// Cleanup function to remove old records when storage is full
const cleanupOldRecords = (moles: Mole[]): Mole[] => {
  return moles.map(mole => {
    if (mole.records.length > 10) {
      // Keep only the 10 most recent records
      const sortedRecords = mole.records.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return {
        ...mole,
        records: sortedRecords.slice(0, 10)
      };
    }
    return mole;
  });
};

export const useMoleStore = create<MoleStore>()(
  persist(
    (set, get) => ({
      moles: [],
      addMole: (mole) => {
        try {
          set((state) => ({ 
            moles: [...state.moles, mole] 
          }));
        } catch (error) {
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            // Clean up old records and try again
            const cleanedMoles = cleanupOldRecords(get().moles);
            set({ moles: cleanedMoles });
            // Try adding the mole again
            set((state) => ({ 
              moles: [...state.moles, mole] 
            }));
          } else {
            throw error;
          }
        }
      },
      addMoleRecord: (moleId, record) => {
        try {
          set((state) => ({
            moles: state.moles.map((mole) => 
              mole.id === moleId 
                ? { ...mole, records: [...mole.records, record] } 
                : mole
            )
          }));
        } catch (error) {
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            // Clean up old records and try again
            const cleanedMoles = cleanupOldRecords(get().moles);
            set({ moles: cleanedMoles });
            // Try adding the record again
            set((state) => ({
              moles: state.moles.map((mole) => 
                mole.id === moleId 
                  ? { ...mole, records: [...mole.records, record] } 
                  : mole
              )
            }));
          } else {
            throw error;
          }
        }
      },
      getMole: (id) => get().moles.find((mole) => mole.id === id),
      getMoleByLocation: (x, y, threshold) => {
        return get().moles.find((mole) => {
          const distance = Math.sqrt(
            Math.pow(mole.location.x - x, 2) + 
            Math.pow(mole.location.y - y, 2)
          );
          return distance <= threshold;
        });
      },
      cleanupOldRecords: () => {
        const cleanedMoles = cleanupOldRecords(get().moles);
        set({ moles: cleanedMoles });
      }
    }),
    {
      name: 'mole-storage',
      onRehydrateStorage: () => (state) => {
        // Clean up on app start if needed
        if (state) {
          state.moles = cleanupOldRecords(state.moles);
        }
      },
    }
  )
); 
