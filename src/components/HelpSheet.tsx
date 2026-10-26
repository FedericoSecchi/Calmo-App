import { Timer, PictureInPicture2, Activity, Droplets, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";

type SectionId = "timer" | "pip" | "exercises" | "hydration" | "social";

const SECTIONS: Array<{ id: SectionId; Icon: typeof Timer }> = [
  { id: "timer", Icon: Timer },
  { id: "pip", Icon: PictureInPicture2 },
  { id: "exercises", Icon: Activity },
  { id: "hydration", Icon: Droplets },
  { id: "social", Icon: Users },
];

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowTour: () => void;
}

export const HelpSheet = ({ open, onOpenChange, onShowTour }: HelpSheetProps) => {
  const { t } = useT();
  const help = t.app.help;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
        data-testid="help-sheet"
      >
        <SheetHeader>
          <SheetTitle>{help.title}</SheetTitle>
          <SheetDescription>{help.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {SECTIONS.map(({ id, Icon }) => {
            const copy = help.sections[id];
            return (
              <div
                key={id}
                className="rounded-2xl border border-border/30 bg-card p-4"
                data-testid={`help-section-${id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{copy.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {copy.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onShowTour();
            }}
            data-testid="help-show-tour"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {help.showTour}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
