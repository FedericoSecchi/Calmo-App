# Modelo de Hábitos - Calmo

Este documento define el modelo de hábitos y cómo se calculan las métricas en Calmo.

## Definición de Hábitos

Un **hábito** en Calmo es cualquier actividad que contribuye al bienestar del usuario:

1. **Pausas completadas** (del timer de Recordatorios)
   - Se registran automáticamente cuando el timer completa una fase REST
   - Tipo: `type="reminder"` en `break_logs`
   - Cuentan para la racha diaria

2. **Vasos de agua consumidos**
   - Registrados manualmente por el usuario
   - Se reinician automáticamente cada día
   - El histórico se conserva para análisis

3. **Registros de dolor**
   - Permiten al usuario documentar molestias
   - Preparado para múltiples zonas (futuro)
   - Cuentan para la racha diaria

## Cálculo de Racha (Streak)

**Regla:** Un día cuenta para la racha si el usuario tiene **al menos 1 actividad** de cualquiera de estos tipos:
- Al menos 1 pausa completada (timer o manual)
- Al menos 1 vaso de agua registrado
- Al menos 1 registro de dolor

**Implementación** (`calculateStreakStatus` en `src/lib/stats.ts`, única fuente; el Dashboard y cualquier otra vista que muestre la racha la usan):
- Se combinan todos los logs (breaks, water, pain) y se agrupan por **día local** del usuario (`src/lib/localDay.ts`).
- La cuenta de días seguidos termina **HOY** si hoy ya tiene actividad, o termina **AYER** si hoy todavía no tiene.
- La racha solo se corta cuando pasa **un día local completo sin actividad**. A la mañana, antes de registrar nada, la racha de ayer sigue viva.
- Devuelve `{ days, needsToday }`. `needsToday` es `true` cuando la racha está viva (`days > 0`) pero hoy todavía no suma.

**UI (Inicio):** se muestra el número de días seguidos. Si `needsToday`, debajo aparece una línea corta: "Haz una pausa hoy para mantenerla" / "Take a break today to keep it". Si hoy ya suma, no se muestra nada extra. Con racha 0 la tarjeta no se muestra.

**Ejemplos** (consulta el lunes):
- Lunes con actividad, domingo y sábado con actividad, viernes sin nada → 3, sin aviso.
- Lunes todavía sin nada, domingo a martes previo con actividad (5 días) → 5, con aviso.
- Lunes y domingo sin nada, sábado con actividad → 0 (pasó un día completo sin actividad).
- Solo lunes con actividad → 1, sin aviso.
- Actividad cada noche a las 23:30, consulta a las 09:00 → racha completa hasta ayer, con aviso.

**Tests:** `src/lib/stats.test.ts`, que `scripts/test-timezones.sh` corre en UTC, Europe/Zagreb, America/Argentina/Buenos_Aires, America/Los_Angeles y Pacific/Auckland.

## Pausas de Hoy

### Componentes

1. **Pausas del Timer** (`timerBreaksToday`)
   - Pausas completadas automáticamente por el timer de Recordatorios
   - Se registran cuando el timer completa una fase REST
   - Tipo: `type="reminder"` en `break_logs`

2. **Ajustes Manuales** (`manualAdjustment`)
   - Correcciones que el usuario hace manualmente (+ / -)
   - Se almacenan en `localStorage` (guest) o futuro backend (auth)
   - Pueden ser positivos o negativos
   - Se reinician automáticamente cada día (pero el histórico se conserva)

3. **Total Hoy** (`breaksToday`)
   - Fórmula: `timerBreaksToday + manualAdjustment`
   - Nunca puede ser negativo (se aplica `Math.max(0, ...)`)

### UI en Dashboard

- **Valor principal:** Total hoy (timer + ajuste)
- **Detalle (si hay ajuste):** Muestra desglose: "X (timer) +Y (ajuste)" o "X (timer) -Y (ajuste)"
- **Controles:** Botones +/- para ajustar manualmente

## Vasos de Agua

### Comportamiento

- **Registro:** El usuario puede agregar o quitar vasos manualmente
- **Reset diario:** Los vasos de hoy se reinician automáticamente al cambiar de día
- **Histórico:** Se conserva para dashboards de progreso y análisis

### UI en Dashboard

- **Valor principal:** Vasos consumidos hoy
- **Controles:** Botones +/- para agregar/quitar vasos
- **Validación:** No se puede quitar si el contador está en 0

## Registros de Dolor

### Modelo Actual (Frontend)

**Estructura actual:**
```typescript
interface PainRecord {
  id: string;
  user_id: string;
  intensity: number; // 1-10
  area: string; // "lumbar" | "cervical" | "wrist" | "shoulders"
  note?: string; // Texto libre
  created_at: string;
}
```

### Modelo Futuro (Preparado)

**Estructura preparada para múltiples zonas:**
```typescript
interface PainRecord {
  id: string;
  user_id: string;
  intensity: number; // 1-10 (intensidad general o promedio)
  areas: string[]; // Array de zonas afectadas
  notes?: string; // Texto libre para especificar otras molestias
  created_at: string;
}
```

**Nota:** El backend actual (`pain_records` table) solo soporta una zona. Para soportar múltiples zonas, se necesitará:
- Opción A: Cambiar `area` a `areas` (array) en la tabla
- Opción B: Crear tabla relacionada `pain_record_areas` (normalización)

**Estado:** El frontend está preparado para manejar múltiples zonas, pero el backend aún no lo soporta. Se documenta aquí para implementación futura.

## Reset Diario

### Automático

Al cambiar de día (detectado por fecha diferente), se resetean:
- Contadores de "hoy" (pausas, agua)
- Ajustes manuales del día anterior

**Importante:** Los registros históricos NO se borran. Solo se resetean los contadores del día actual.

### Manual

El usuario puede resetear manualmente:
- Ajustes manuales del día (botón "Reset ajustes")
- Contador de vasos de agua del día (botón "Reset agua")

**Nota:** Los resets manuales aún no están implementados en la UI, pero la estructura está preparada.

## Persistencia

### Guest Mode

- **Pausas:** `localStorage` → `calmo_break_logs` (array de ISO dates)
- **Agua:** `localStorage` → `calmo_water_logs` (array de ISO dates)
- **Ajustes manuales:** `localStorage` → `calmo_manual_break_adjustments` (object: `{ "YYYY-MM-DD": number }`)
- **Dolor:** `localStorage` → `calmo_pain_records` (array de objetos)

### Auth Mode

- **Pausas:** Supabase → `break_logs` table
- **Agua:** Supabase → `water_logs` table
- **Ajustes manuales:** TODO - Futuro backend table `manual_break_adjustments`
- **Dolor:** Supabase → `pain_records` table

## Qué Cuenta para la Racha

✅ **Sí cuenta:**
- Pausas completadas por el timer (automáticas)
- Ajustes manuales de pausas (+ / -)
- Vasos de agua registrados
- Registros de dolor

❌ **No cuenta:**
- Pausas que el usuario registra manualmente con el botón "+" (estas son ajustes, no pausas reales)
- Nota: Los ajustes manuales SÍ cuentan para la racha porque representan actividad del usuario

## Preparación para Futuro

### Agua Avanzada

- Recordatorios de agua independientes del timer
- Durante foco, el agua se activa automáticamente
- Intervalo configurable (a definir)

### Ejercicios

- Recomendaciones después de REST completado
- Integración con sección Ejercicios
- Tracking de ejercicios completados

### IA / Recomendaciones

- Análisis de patrones de dolor
- Sugerencias personalizadas basadas en historial
- Predicción de días de mayor molestia

