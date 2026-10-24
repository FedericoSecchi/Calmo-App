import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Droplets, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWaterLogs } from "@/hooks/useWaterLogs";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";

interface EndOfFocusDialogProps {
  open: boolean;
  onClose: () => void;
}

export const EndOfFocusDialog = ({ open, onClose }: EndOfFocusDialogProps) => {
  const navigate = useNavigate();
  const { addWaterGlass } = useWaterLogs();
  const { toast } = useToast();
  const { t } = useT();
  const d = t.app.endOfFocus;
  const dash = t.app.dashboard;

  const handleAddWater = () => {
    addWaterGlass();
    toast({
      title: dash.toasts.waterAdded,
      description: dash.toasts.waterAddedDesc,
    });
  };

  const handleGoToExercises = () => {
    onClose();
    navigate("/app/exercises");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{d.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">{d.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          <Button variant="outline" className="w-full justify-start h-auto py-4" onClick={handleAddWater}>
            <Droplets className="h-5 w-5 mr-3 text-success" />
            <div className="text-left">
              <p className="font-medium">{d.drinkWater}</p>
              <p className="text-xs text-muted-foreground">{d.drinkWaterDesc}</p>
            </div>
          </Button>

          <Button variant="outline" className="w-full justify-start h-auto py-4" onClick={handleGoToExercises}>
            <Activity className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium">{d.shortExercise}</p>
              <p className="text-xs text-muted-foreground">{d.shortExerciseDesc}</p>
            </div>
          </Button>

          <Button variant="ghost" className="w-full mt-2" onClick={onClose}>
            {d.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
