export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

const ACTIONS: QuickAction[] = [
  {
    id: "plan",
    label: "Plan tonight",
    prompt: "Plan a low-key evening for everyone at home tonight",
  },
  {
    id: "checkin",
    label: "Care check-in",
    prompt: "Log a care check-in for our elder and tell me how they're doing",
  },
  {
    id: "cozy",
    label: "Cozy film",
    prompt: "Plan a cozy captioned film night for the family",
  },
  {
    id: "active",
    label: "Gentle stretch",
    prompt: "Plan a short active stretch evening that works for kids and grandma",
  },
  {
    id: "creative",
    label: "No screens",
    prompt: "Plan a creative evening without screens for the kids and grandma",
  },
  {
    id: "adults",
    label: "Adults wind-down",
    prompt: "Plan a quiet adults-only wind-down after the kids are in bed",
  },
];

type Props = {
  busy: boolean;
  demoRunning: boolean;
  onAction: (prompt: string) => void;
};

export function ActionRail({ busy, demoRunning, onAction }: Props) {
  const locked = busy || demoRunning;
  return (
    <div className="action-rail" aria-label="Quick actions">
      <span className="row-label">Try</span>
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="action-chip"
          disabled={locked}
          onClick={() => onAction(action.prompt)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
