import { create } from "zustand";

type DateScopeState = {
  selectedDate: string;
  availableDates: string[];
  setSelectedDate: (date: string) => void;
  setAvailableDates: (dates: string[]) => void;
  clearDateScope: () => void;
};

function normalizeDates(dates: string[]) {
  return Array.from(new Set(dates.filter(Boolean))).sort((a, b) =>
    b.localeCompare(a)
  );
}

export const useDateScopeStore = create<DateScopeState>((set) => ({
  selectedDate: "",
  availableDates: [],

  setSelectedDate: (date) =>
    set((state) => {
      if (!date) return { selectedDate: "" };

      if (
        state.availableDates.length > 0 &&
        !state.availableDates.includes(date)
      ) {
        return { selectedDate: state.availableDates[0] ?? "" };
      }

      return { selectedDate: date };
    }),

  setAvailableDates: (dates) =>
    set((state) => {
      const normalized = normalizeDates(dates);

      const nextSelected =
        state.selectedDate && normalized.includes(state.selectedDate)
          ? state.selectedDate
          : normalized[0] ?? "";

      return {
        availableDates: normalized,
        selectedDate: nextSelected,
      };
    }),

  clearDateScope: () =>
    set({
      selectedDate: "",
      availableDates: [],
    }),
}));