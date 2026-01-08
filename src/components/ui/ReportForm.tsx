import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type ReportCategory = "wrong_info" | "closed" | "missing_info" | "other";

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Type of item being reported */
  itemType: "resort" | "clinic" | "hospital";
  /** Name of the item */
  itemName: string;
  /** ID of the item for tracking */
  itemId: string;
  /** Optional callback when report is submitted */
  onSubmit?: (report: ReportData) => void;
}

export interface ReportData {
  itemType: "resort" | "clinic" | "hospital";
  itemId: string;
  itemName: string;
  category: ReportCategory;
  description: string;
  contactEmail?: string;
  timestamp: string;
}

const CATEGORIES: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "wrong_info", label: "Incorrect information", icon: "❌" },
  { value: "closed", label: "Permanently closed", icon: "🚫" },
  { value: "missing_info", label: "Missing information", icon: "❓" },
  { value: "other", label: "Other issue", icon: "📝" },
];

export function ReportForm({
  isOpen,
  onClose,
  itemType,
  itemName,
  itemId,
  onSubmit,
}: ReportFormProps) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) return;

    setIsSubmitting(true);

    const reportData: ReportData = {
      itemType,
      itemId,
      itemName,
      category,
      description: description.trim(),
      contactEmail: contactEmail.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    // Track the report (analytics)
    try {
      // In production, this would POST to a Netlify function or similar
      // For now, we just log and show success
      console.log("[Report Submitted]", reportData);
      
      // Call optional callback
      onSubmit?.(reportData);

      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setCategory(null);
    setDescription("");
    setContactEmail("");
    setIsSubmitted(false);
    onClose();
  };

  const itemLabel = itemType === "resort" ? "resort" : itemType === "clinic" ? "dialysis clinic" : "hospital";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSubmitted ? "Thank You!" : "Report an Issue"}
    >
      {isSubmitted ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-300 mb-2">
            Your report has been submitted.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We review reports regularly and will update our data accordingly.
            {contactEmail && " We may contact you if we need more information."}
          </p>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item being reported */}
          <div className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Reporting issue with:</p>
            <p className="text-sm text-gray-200 font-medium">
              {itemName}
              <span className="text-gray-500 ml-2">({itemLabel})</span>
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              What's the issue?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`
                    p-3 rounded-lg border text-left text-sm transition-all
                    ${
                      category === cat.value
                        ? "border-pink-500 bg-pink-500/10 text-pink-300"
                        : "border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600"
                    }
                  `}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Please describe the issue <span className="text-pink-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                category === "wrong_info"
                  ? "What information is incorrect? What should it say?"
                  : category === "closed"
                  ? "When did this location close? Any additional details?"
                  : category === "missing_info"
                  ? "What information is missing that would be helpful?"
                  : "Please describe the issue..."
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-pink-500 text-sm resize-none"
              required
            />
          </div>

          {/* Optional Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Email <span className="text-gray-600">(optional, for follow-up)</span>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-pink-500 text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!category || !description.trim()}
              className="flex-1"
            >
              Submit Report
            </Button>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Your report helps keep our data accurate for everyone.
          </p>
        </form>
      )}
    </Modal>
  );
}
