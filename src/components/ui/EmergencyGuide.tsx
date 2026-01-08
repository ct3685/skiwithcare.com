import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface EmergencyGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

type Severity = "911" | "patrol" | "urgent" | "er" | null;

interface DecisionOption {
  id: Severity;
  emoji: string;
  title: string;
  description: string;
  examples: string[];
  action: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const OPTIONS: DecisionOption[] = [
  {
    id: "911",
    emoji: "🚨",
    title: "Call 911",
    description: "Life-threatening emergency requiring immediate response",
    examples: [
      "Unconscious or unresponsive",
      "Difficulty breathing",
      "Severe bleeding that won't stop",
      "Suspected spinal/neck injury",
      "Chest pain or signs of stroke",
    ],
    action: "Call 911 immediately",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
  },
  {
    id: "patrol",
    emoji: "⛑️",
    title: "Ski Patrol",
    description: "On-mountain injury requiring transport or first aid",
    examples: [
      "Can't ski down on your own",
      "Suspected broken bone",
      "Head injury with confusion",
      "Deep cuts needing stitches",
      "Knee/ankle injury - can't bear weight",
    ],
    action: "Contact any lift operator or call resort emergency line",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/40",
  },
  {
    id: "urgent",
    emoji: "🏥",
    title: "Urgent Care",
    description: "Non-life-threatening but needs same-day medical attention",
    examples: [
      "Minor fractures (fingers, toes)",
      "Sprains and strains",
      "Cuts needing stitches",
      "Minor frostbite",
      "Illness (flu, infections)",
    ],
    action: "Visit nearest urgent care clinic",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/40",
  },
  {
    id: "er",
    emoji: "🚑",
    title: "Emergency Room",
    description: "Serious injury requiring hospital-level care",
    examples: [
      "Complex fractures",
      "Possible internal bleeding",
      "Severe allergic reactions",
      "High fever with confusion",
      "Injuries needing imaging (CT/MRI)",
    ],
    action: "Go to nearest hospital ER",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/40",
  },
];

export function EmergencyGuide({ isOpen, onClose }: EmergencyGuideProps) {
  const [selectedOption, setSelectedOption] = useState<Severity>(null);

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  const selectedDetails = OPTIONS.find((o) => o.id === selectedOption);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🩺 Where Should I Go?"
    >
      {!selectedOption ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">
            Select the option that best describes your situation:
          </p>

          {OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${option.bgColor} ${option.borderColor}
                hover:scale-[1.02] hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-accent-primary
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <div>
                  <h4 className={`font-semibold ${option.color}`}>
                    {option.title}
                  </h4>
                  <p className="text-sm text-text-muted mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}

          <p className="text-xs text-text-muted mt-4 italic">
            ⚠️ This is general guidance only. When in doubt, always call 911.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected option header */}
          <div
            className={`
              p-4 rounded-lg border-2
              ${selectedDetails?.bgColor} ${selectedDetails?.borderColor}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedDetails?.emoji}</span>
              <div>
                <h4 className={`text-xl font-bold ${selectedDetails?.color}`}>
                  {selectedDetails?.title}
                </h4>
                <p className="text-sm text-text-muted">
                  {selectedDetails?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div>
            <h5 className="text-sm font-medium text-text-primary mb-2">
              Examples:
            </h5>
            <ul className="space-y-1">
              {selectedDetails?.examples.map((example, i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary flex items-start gap-2"
                >
                  <span className="text-text-muted">•</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Action */}
          <div
            className={`
              p-3 rounded-lg text-center font-medium
              ${selectedDetails?.bgColor} ${selectedDetails?.color}
            `}
          >
            {selectedDetails?.action}
          </div>

          {/* 911 call button for emergency */}
          {selectedOption === "911" && (
            <a
              href="tel:911"
              className="block w-full py-3 px-4 rounded-lg bg-red-600 text-white text-center font-bold text-lg hover:bg-red-700 transition-colors"
            >
              📞 Call 911 Now
            </a>
          )}

          {/* Back button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSelectedOption(null)}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Trigger button for opening the Emergency Guide
 */
interface EmergencyGuideTriggerProps {
  onClick: () => void;
  className?: string;
}

export function EmergencyGuideTrigger({
  onClick,
  className = "",
}: EmergencyGuideTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-2.5 px-4 rounded-lg
        bg-gradient-to-r from-red-600/20 to-amber-600/20
        border border-red-500/30
        text-sm font-medium text-red-300
        hover:from-red-600/30 hover:to-amber-600/30
        hover:border-red-500/50
        transition-all
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      <span>🩺</span>
      <span>Where Should I Go?</span>
    </button>
  );
}
