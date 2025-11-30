// src/hooks/useUndoRedoShortcuts.ts
import { useEffect } from "react";
import { useEditorStore } from "./useEditorStore";

/**
 * Hook to enable keyboard shortcuts for Undo/Redo in the editor.
 * 
 * Shortcuts:
 * - Ctrl+Z (or Cmd+Z on Mac): Undo
 * - Ctrl+Shift+Z (or Cmd+Shift+Z on Mac): Redo
 * - Ctrl+Y (Windows alternative): Redo
 */
export function useUndoRedoShortcuts() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the target is an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isTextInput = 
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable;
      
      // Don't intercept undo/redo for native text inputs
      // (they have their own undo/redo)
      if (isTextInput) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      // Undo: Ctrl+Z / Cmd+Z
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Redo: Ctrl+Y (Windows alternative)
      if (e.key === "y" && !isMac) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}

export default useUndoRedoShortcuts;

