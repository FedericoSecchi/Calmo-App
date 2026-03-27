import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePainRecords } from "@/hooks/usePainRecords";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const painAreas = [
  { id: "lumbar", label: "Lumbar" },
  { id: "cervical", label: "Cuello" },
  { id: "wrist", label: "Muñecas" },
  { id: "shoulders", label: "Hombros" },
];

const getPainColor = (level: number) => {
  if (level <= 3) return "text-success";
  if (level <= 6) return "text-amber-500";
  return "text-destructive";
};

const Pain = () => {
  const { toast } = useToast();
  const { isGuest } = useAuth();
  const [painLevel, setPainLevel] = useState(5);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [daysFilter, setDaysFilter] = useState(30);
  const [localRecords, setLocalRecords] = useState<Array<{ date: string; intensity: number }>>([]);

  const { records, isLoading, createRecord, isCreating } = usePainRecords(daysFilter);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const chartData = useMemo(() => {
    const dataSource = isGuest ? localRecords : records;

    const grouped = dataSource.reduce((acc, record) => {
      const date = formatDateToYYYYMMDD(record.created_at || record.date);
      if (!acc[date]) {
        acc[date] = { date, intensities: [] };
      }
      acc[date].intensities.push(record.intensity);
      return acc;
    }, {} as Record<string, { date: string; intensities: number[] }>);

    return Object.entries(grouped)
      .map(([dateStr, { intensities }]) => ({
        dateStr,
        date: new Date(dateStr).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
        intensity: Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
      .map(({ date, intensity }) => ({ date, intensity }));
  }, [records, localRecords, isGuest]);

  const handleSubmit = async () => {
    if (selectedAreas.length === 0) {
      toast({
        title: "Campo requerido",
        description: "Por favor selecciona al menos una zona afectada",
        variant: "destructive",
      });
      return;
    }

    if (painLevel < 1 || painLevel > 10) {
      toast({
        title: "Valor inválido",
        description: "El nivel de dolor debe estar entre 1 y 10",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isGuest) {
        setLocalRecords([
          ...localRecords,
          { date: new Date().toISOString(), intensity: painLevel },
        ]);
        toast({
          title: "Registro guardado (modo invitado)",
          description: `Dolor nivel ${painLevel} en ${selectedAreas.join(", ")}`,
        });
      } else {
        await Promise.all(
          selectedAreas.map((area) =>
            createRecord({ area, intensity: painLevel, notes: note || undefined })
          )
        );
        toast({
          title: "Registro guardado",
          description: `Dolor nivel ${painLevel} en ${selectedAreas.length > 1 ? `${selectedAreas.length} zonas` : selectedAreas[0]}`,
        });
      }

      setPainLevel(5);
      setSelectedAreas([]);
      setNote("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      if (import.meta.env.DEV) {
        console.error("Error saving pain record:", error);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">Registrar dolor</h1>
        <p className="text-muted-foreground mt-1 text-sm">¿Cómo te sientes hoy?</p>
      </motion.div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 bg-card rounded-2xl p-5 border border-border/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-foreground">Historial</h2>
            <div className="flex gap-1.5">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysFilter(days)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    daysFilter === days
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Cargando historial...</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Pain Level */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium text-sm text-foreground">Nivel de dolor</label>
            <span className={`text-2xl font-heading ${getPainColor(painLevel)}`}>{painLevel}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Sin dolor</span>
            <span>Dolor intenso</span>
          </div>
        </motion.div>

        {/* Area Selection (multi-select) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <label className="font-medium text-sm text-foreground mb-3 block">
            Zona afectada
            {selectedAreas.length > 1 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({selectedAreas.length} seleccionadas)</span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {painAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => toggleArea(area.id)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedAreas.includes(area.id)
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {area.label}
                {selectedAreas.includes(area.id) && (
                  <Check className="h-3.5 w-3.5 inline ml-2 text-primary" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <label className="font-medium text-sm text-foreground mb-3 block">Nota (opcional)</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="¿Qué estabas haciendo?"
            className="resize-none border-0 bg-muted/50 focus-visible:ring-0"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar registro"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Pain;
