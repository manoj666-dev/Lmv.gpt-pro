import { Code, FileText, Sparkles, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  const actions = [
    { icon: FileText, label: "Summarize text", color: "text-orange-500" },
    { icon: Code, label: "Write a code", color: "text-green-500" },
    { icon: Sparkles, label: "Surprise me", color: "text-blue-500" },
    { icon: MoreHorizontal, label: "More", color: "text-muted-foreground" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="rounded-full px-6 py-6 bg-muted/50 border-border/50 hover:bg-muted"
          onClick={() => onAction(action.label)}
        >
          <action.icon className={`h-5 w-5 mr-2 ${action.color}`} />
          <span className="text-sm">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};
