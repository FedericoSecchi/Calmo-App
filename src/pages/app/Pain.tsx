import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePainRecords } from "@/hooks/usePainRecords";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/analytics";

const painAreaIds = ["lumbar", "cervical", "wrist", "shoulders"] as const;
type PainAreaId = (typeof painAreaIds)[number];

const getPainColor = (level: number) => {
  if (level <= 3) return "text-success";
  if (level <= 6) return "text-amber-500";
  return "text-destructive";
};

const Pain = () => {
  const { toast } = useToast();
  const { t, lang } = useT();
  const p = t.app.pain;
  const [painLevel, setPainLevel] = useState(5);
  const [selectedAreas, setSelectedAreas] = useState<PainAreaId[]>([]);
  const [note, setNote] = useState("");
  const [daysFilter, setDaysFilter] = useState(30);
  const { records, createRecord } = usePainRecords(daysFilter);

  const toggleArea = (id: PainAreaId) => {
    setSelectedAreas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const chartData = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const date = formatDateToYYYYMMDD(record.created_at);
      if (!acc[date]) acc[date] = { date, intensities: [] };
      acc[date].intensities.push(record.intensity);
      return acc;
    }, {} as Record<string, { date: string; intensities: number[] }>);

    return Object.entries(grouped)
      .map(([dateStr, { intensities }]) => ({
        dateStr,
        date: new Date(dateStr).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
          month: "short",
          day: "numeric",
        }),
        intensity: Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
      .map(({ date, intensity }) => ({ date, intensity }));
  }, [records, lang]);

  const handleSubmit = () => {
    if (selectedAreas.length === 0) {
      toast({ title: p.toasts.areaRequired, variant: "destructive" });
      return;
    }
    selectedAreas.forEach((area) => createRecord({ area, intensity: painLevel, notes: note || undefined }));
    track("pain_logged", { areas: selectedAreas.length });
    toast({ title: p.toasts.saved });
    setPainLevel(5);
    setSelectedAreas([]);
    setNote("");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">{p.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{p.subtitle}</p>
      </motion.div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 bg-muted/40 border border-border/40 rounded-xl px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>{p.localNote}</span>
      </div>

      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 bg-card rounded-2xl p-5 border border-border/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-foreground">{p.historyLabel}</h2>
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

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium text-sm text-foreground">{p.levelLabel}</label>
            <span className={`text-2xl font-heading ${getPainColor(painLevel)}`}>
              {painLevel}
              <span className="text-sm text-muted-foreground font-normal">/10</span>
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label={p.levelLabel}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{p.noPain}</span>
            <span>{p.intensePain}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <label className="font-medium text-sm text-foreground mb-3 block">
            {p.areaLabel}
            {selectedAreas.length > 1 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({selectedAreas.length} {p.selectedPostfix})
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {painAreaIds.map((areaId) => (
              <button
                key={areaId}
                onClick={() => toggleArea(areaId)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedAreas.includes(areaId)
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {p.areas[areaId]}
                {selectedAreas.includes(areaId) && <Check className="h-3.5 w-3.5 inline ml-2 text-primary" />}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-card rounded-2xl p-5 border border-border/30"
        >
          <label className="font-medium text-sm text-foreground mb-3 block">{p.noteLabel}</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={p.notePlaceholder}
            className="resize-none border-0 bg-muted/50 focus-visible:ring-0"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Button variant="hero" size="lg" className="w-full" onClick={handleSubmit}>
            {p.saveLabel}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Pain;
