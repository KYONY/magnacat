const SELECTED_CLASS = "mc-selected";
const HOVER_CLASS = "mc-hover";
const WORD_SELECTOR = ".mc-word";

export interface WordSelection {
  text: string;
  context: string;
}

export type WordSelectedCallback = (selection: WordSelection) => void;
export type SelectionClearedCallback = () => void;

interface State {
  selectedWords: HTMLElement[];
  lastClickedIndex: number | null;
  parentSegment: HTMLElement | null;
  onWordSelected: WordSelectedCallback | null;
  onSelectionCleared: SelectionClearedCallback | null;
}

const state: State = {
  selectedWords: [],
  lastClickedIndex: -1,
  parentSegment: null,
  onWordSelected: null,
  onSelectionCleared: null,
};

function clearSelection(): void {
  for (const el of state.selectedWords) {
    el.classList.remove(SELECTED_CLASS);
  }
  const hadSelection = state.selectedWords.length > 0;
  state.selectedWords = [];
  state.lastClickedIndex = -1;
  state.parentSegment = null;
  if (hadSelection) {
    state.onSelectionCleared?.();
  }
}

function getWordIndex(el: HTMLElement): number {
  return parseInt(el.getAttribute("data-index") ?? "-1", 10);
}

function getSegment(wordEl: HTMLElement): HTMLElement | null {
  return wordEl.closest(".ytp-caption-segment");
}

function selectRange(segment: HTMLElement, fromIdx: number, toIdx: number): void {
  const min = Math.min(fromIdx, toIdx);
  const max = Math.max(fromIdx, toIdx);
  const words = segment.querySelectorAll<HTMLElement>(WORD_SELECTOR);

  for (const el of state.selectedWords) {
    el.classList.remove(SELECTED_CLASS);
  }
  state.selectedWords = [];

  words.forEach((w) => {
    const idx = getWordIndex(w);
    if (idx >= min && idx <= max) {
      w.classList.add(SELECTED_CLASS);
      state.selectedWords.push(w);
    }
  });
}

function handleWordMouseDown(e: MouseEvent): void {
  const target = (e.target as HTMLElement).closest<HTMLElement>(WORD_SELECTOR);
  if (!target) return;

  e.stopPropagation();
  e.preventDefault();

  const segment = getSegment(target);
  if (!segment) return;

  const index = getWordIndex(target);

  if (e.shiftKey && state.lastClickedIndex !== -1 && state.parentSegment === segment) {
    selectRange(segment, state.lastClickedIndex, index);
  } else {
    clearSelection();
    target.classList.add(SELECTED_CLASS);
    state.selectedWords = [target];
    state.lastClickedIndex = index;
    state.parentSegment = segment;
  }

  const text = state.selectedWords.map((w) => w.textContent).join(" ");
  const context = target.getAttribute("data-sentence") ?? text;
  state.onWordSelected?.({ text, context });
}

function handleWordHover(e: MouseEvent): void {
  const target = (e.target as HTMLElement).closest<HTMLElement>(WORD_SELECTOR);
  if (!target) return;
  target.classList.add(HOVER_CLASS);
}

function handleWordHoverOut(e: MouseEvent): void {
  const target = (e.target as HTMLElement).closest<HTMLElement>(WORD_SELECTOR);
  if (!target) return;
  target.classList.remove(HOVER_CLASS);
}

function handleOutsideClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!target.closest(WORD_SELECTOR) && !target.closest("#magnacat-tooltip")) {
    clearSelection();
  }
}

let boundContainer: HTMLElement | null = null;

export function initWordSelector(
  container: HTMLElement,
  onWordSelected: WordSelectedCallback,
  onSelectionCleared: SelectionClearedCallback,
): void {
  state.onWordSelected = onWordSelected;
  state.onSelectionCleared = onSelectionCleared;
  boundContainer = container;

  container.addEventListener("mousedown", handleWordMouseDown, true);
  container.addEventListener("mouseover", handleWordHover);
  container.addEventListener("mouseout", handleWordHoverOut);
  document.addEventListener("mousedown", handleOutsideClick);
}

export function getSelectedWords(): WordSelection | null {
  if (state.selectedWords.length === 0) return null;
  const text = state.selectedWords.map((w) => w.textContent).join(" ");
  const context = state.selectedWords[0]?.getAttribute("data-sentence") ?? text;
  return { text, context };
}

export function cleanupWordSelector(): void {
  clearSelection();
  if (boundContainer) {
    boundContainer.removeEventListener("mousedown", handleWordMouseDown, true);
    boundContainer.removeEventListener("mouseover", handleWordHover);
    boundContainer.removeEventListener("mouseout", handleWordHoverOut);
  }
  document.removeEventListener("mousedown", handleOutsideClick);
  state.onWordSelected = null;
  state.onSelectionCleared = null;
  boundContainer = null;
}
