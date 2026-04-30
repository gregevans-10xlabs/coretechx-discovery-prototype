// Small helper to render a clickable trade name. Opens the TradeDrawer when
// clicked. Used across CockpitView, FieldView, PortfolioView, CommitmentAnatomy
// — anywhere a trade name appears in operator-facing copy.
//
// Renders as a <span> rather than <button> because trade names appear inside
// queue cards (which are themselves <button> elements for the row click).
// Nested <button> is invalid HTML; a span with onClick + role + tabindex is
// the accessible alternative.

type Props = {
  name: string;
  onSelectTrade?: (name: string) => void;
  className?: string;
  // For commitment owners: when the "owner" is an AI agent (e.g. "AI Triage Agent"),
  // we don't want it to be clickable. Pass `disabled` to render plain text.
  disabled?: boolean;
};

export default function TradeLink({ name, onSelectTrade, className = "", disabled = false }: Props) {
  if (disabled || !onSelectTrade) {
    return <span className={className}>{name}</span>;
  }
  const handle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onSelectTrade(name);
  };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(e); } }}
      className={`${className} hover:underline hover:text-[#0077a8] decoration-dotted underline-offset-2 transition-colors cursor-pointer`}
      title={`Show ${name} details`}
    >
      {name}
    </span>
  );
}

// Heuristic for whether a "trade" name is actually an AI agent (which should
// NOT be clickable since there's no agent profile drawer in v1).
export function isAIAgent(owner: string): boolean {
  return /^AI\b/i.test(owner) || /Agent$/.test(owner);
}
