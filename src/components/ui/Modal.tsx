import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Use portal to render at document body level (avoids overflow:hidden clipping)
  return createPortal(
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70 backdrop-blur-sm
        transition-opacity duration-300
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={onClose}
    >
      <div
        className={`
          bg-bg-secondary
          border border-border
          rounded-xl
          p-6
          w-[90%] max-w-md
          max-h-[90vh] overflow-y-auto
          shadow-2xl
          transform transition-transform duration-300
          ${isOpen ? "translate-y-0" : "translate-y-4"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="text-text-secondary">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

