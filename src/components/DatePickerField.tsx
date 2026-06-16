import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing } from '@constants/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ABBREVS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES  = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const [yr, mo, dy] = value.split('-').map(Number);
  if (!yr || !mo || !dy) return value;
  const d = new Date(yr, mo - 1, dy);
  if (isNaN(d.getTime())) return value;
  return `${MONTH_NAMES[mo - 1]} ${dy}, ${yr}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DatePickerFieldProps {
  value:        string;
  onChange:     (date: string) => void;
  placeholder?: string;
  label?:       string;
  disablePast?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  disablePast = false,
}: DatePickerFieldProps) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const accent      = colors.brand.primary;
  const fieldBg     = isDark ? 'rgba(255,255,255,0.07)' : colors.background.tertiary;
  const borderC     = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.09)';
  const textPrimary = colors.text.primary;
  const textTert    = colors.text.tertiary;
  const hdrColor    = isDark ? 'rgba(148,163,184,0.55)' : 'rgba(0,0,0,0.32)';
  const textDim     = isDark ? 'rgba(148,163,184,0.28)' : 'rgba(0,0,0,0.18)';
  const todayBg     = accent + (isDark ? '28' : '18');

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) {
      const [yr, mo] = value.split('-').map(Number);
      if (yr && mo) return new Date(yr, mo - 1, 1);
    }
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function dayStr(d: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const handleSelect = (ds: string) => {
    Haptics.selectionAsync();
    onChange(ds);
    setOpen(false);
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    onChange('');
    setOpen(false);
  };

  return (
    <View style={{ gap: 7 }}>
      {label != null && (
        <AppText variant="labelSM" color={textTert} style={s.label}>{label}</AppText>
      )}

      {/* Trigger row */}
      <Pressable
        onPress={() => { setOpen(o => !o); Haptics.selectionAsync(); }}
        style={[s.field, { backgroundColor: fieldBg, borderColor: open ? accent + '70' : borderC }]}
      >
        <Ionicons name="calendar-outline" size={16} color={open ? accent : textTert} />
        <AppText style={[s.fieldText, { color: value ? textPrimary : textTert }]} numberOfLines={1}>
          {value ? formatDisplay(value) : placeholder}
        </AppText>
        {value ? (
          <Pressable onPress={handleClear} hitSlop={10} style={s.clearBtn}>
            <Ionicons name="close-circle" size={16} color={textTert} />
          </Pressable>
        ) : (
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={textTert} />
        )}
      </Pressable>

      {/* Inline calendar */}
      {open && (
        <View style={[s.calendar, { backgroundColor: fieldBg, borderColor: accent + '28' }]}>
          {/* Month navigation */}
          <View style={s.calHdr}>
            <Pressable
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              hitSlop={12}
              style={({ pressed }) => [s.navBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.6 : 1,
              }]}
            >
              <Ionicons name="chevron-back" size={15} color={accent} />
            </Pressable>
            <AppText style={[s.monthLbl, { color: textPrimary }]}>
              {MONTH_NAMES[month]} {year}
            </AppText>
            <Pressable
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              hitSlop={12}
              style={({ pressed }) => [s.navBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.6 : 1,
              }]}
            >
              <Ionicons name="chevron-forward" size={15} color={accent} />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={s.calRow}>
            {DAY_ABBREVS.map(d => (
              <AppText key={d} style={[s.dow, { color: hdrColor }]}>{d}</AppText>
            ))}
          </View>

          {/* Day grid */}
          {Array.from({ length: cells.length / 7 }, (_, wi) => (
            <View key={wi} style={s.calRow}>
              {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
                if (!day) return <View key={ci} style={s.cell} />;
                const ds      = dayStr(day);
                const cellDt  = new Date(year, month, day);
                const isPast  = disablePast && cellDt < today;
                const isToday = ds === toDateStr(today);
                const isSel   = ds === value;
                return (
                  <Pressable
                    key={ci}
                    onPress={() => !isPast && handleSelect(ds)}
                    style={[
                      s.cell,
                      isToday && !isSel && { backgroundColor: todayBg, borderRadius: 9 },
                      isSel             && { backgroundColor: accent,   borderRadius: 9 },
                    ]}
                  >
                    <AppText style={[
                      s.dayNum,
                      { color: isPast ? textDim : textPrimary },
                      isToday && !isSel && { color: accent, fontWeight: '700' },
                      isSel             && { color: '#fff',  fontWeight: '800' },
                    ]}>
                      {day}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  label: { fontSize: 10, letterSpacing: 0.9, fontWeight: '700' },

  field: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing['2'],
    paddingHorizontal: Spacing['3'],
    height:           48,
    borderRadius:     Radius.lg,
    borderWidth:      1,
  },
  fieldText: { flex: 1, fontSize: 14 },
  clearBtn:  { padding: 2 },

  calendar: {
    marginTop:    0,
    borderRadius: Radius.lg,
    borderWidth:  1,
    padding:      Spacing['3'],
    gap:          2,
  },
  calHdr: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  navBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monthLbl: { fontSize: 14, fontWeight: '700' },

  calRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dow: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', paddingVertical: 4 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', margin: 1 },
  dayNum: { fontSize: 13, fontWeight: '500' },
});
