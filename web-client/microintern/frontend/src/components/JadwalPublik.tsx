import React, { useState, useEffect } from "react";
import { getPublicSchedule } from "../services/pendaftaran.service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BadgeStatus from "./BadgeStatus";

interface JadwalPublik {
  pengajuan_id: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  jenis_kelompok: "individu" | "kelompok";
  jumlah_peserta: number;
  institusi: string;
  program_studi: string;
  periode_status: "berjalan" | "mendatang" | null;
}

interface JadwalPublikWithSlot extends JadwalPublik {
  slotIndex: number;
  isBerjalan: boolean;
}

interface JadwalPublikResponse {
  schedules: JadwalPublik[];
  kapasitas_maksimal: number;
}

interface MonthItem {
  name: string;
  index: number;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isNextMonth: boolean;
  date: Date;
}

const parseLocalDateStart = (dateStr: string): Date => {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  return new Date(dateStr);
};

const parseLocalDateEnd = (dateStr: string): Date => {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 23, 59, 59, 999);
  }
  return new Date(dateStr);
};

const formatDateIndo = (date: Date) => {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateStringIndo = (dateStr: string) => {
  try {
    const d = parseLocalDateStart(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const monthsList: MonthItem[] = [
  { name: "Januari", index: 0 },
  { name: "Februari", index: 1 },
  { name: "Maret", index: 2 },
  { name: "April", index: 3 },
  { name: "Mei", index: 4 },
  { name: "Juni", index: 5 },
  { name: "Juli", index: 6 },
  { name: "Agustus", index: 7 },
  { name: "September", index: 8 },
  { name: "Oktober", index: 9 },
  { name: "November", index: 10 },
  { name: "Desember", index: 11 },
];

const assignSlots = (list: JadwalPublik[]): JadwalPublikWithSlot[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTime = now.getTime();

  const prepared = list.map((item) => ({
    item,
    start: parseLocalDateStart(item.tanggal_masuk).getTime(),
    end: parseLocalDateEnd(item.tanggal_keluar).getTime(),
  }));

  prepared.sort((a, b) => a.start - b.start);

  const result: (JadwalPublikWithSlot & { start: number; end: number })[] = [];

  for (const prep of prepared) {
    let slot = 0;
    while (true) {
      const hasConflict = result.some((other) => {
        if (other.slotIndex !== slot) return false;

        return prep.start <= other.end && prep.end >= other.start;
      });

      if (!hasConflict) {
        break;
      }
      slot++;
    }

    const isBerjalan = nowTime >= prep.start && nowTime <= prep.end;

    result.push({
      ...prep.item,
      slotIndex: slot,
      isBerjalan,
      start: prep.start,
      end: prep.end,
    });
  }

  return result.map((item) => {
    const { start, end, ...rest } = item;
    return rest;
  });
};

const getCalendarDays = (year: number, monthIndex: number): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, monthIndex, 1);
  const firstDayOfWeek = firstDay.getDay();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    days.push({
      day: dayNum,
      isCurrentMonth: false,
      isNextMonth: false,
      date: new Date(prevYear, prevMonth, dayNum, 0, 0, 0, 0),
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      isNextMonth: false,
      date: new Date(year, monthIndex, i, 0, 0, 0, 0),
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    days.push({
      day: i,
      isCurrentMonth: false,
      isNextMonth: true,
      date: new Date(nextYear, nextMonth, i, 0, 0, 0, 0),
    });
  }

  return days;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const JadwalPublik: React.FC = () => {
  const [schedules, setSchedules] = useState<JadwalPublikWithSlot[]>([]);
  const [kapasitasMaksimal, setKapasitasMaksimal] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"calendar" | "list">("calendar");
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getPublicSchedule();
        if (res?.status === "success" && res.data) {
          const data = res.data as JadwalPublikResponse;
          const assignedSchedules = assignSlots(data.schedules || []);
          setSchedules(assignedSchedules);
          setKapasitasMaksimal(data.kapasitas_maksimal || 10);
        } else {
          setSchedules([]);
        }
      } catch (err) {
        console.error("Failed to fetch public schedule:", err);
        setError("Gagal memuat jadwal PKL. Silakan coba beberapa saat lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calendarDaysByMonth = React.useMemo(() => {
    return monthsList.map((month) => ({
      month,
      days: getCalendarDays(selectedYear, month.index),
    }));
  }, [selectedYear]);

  const activeBatchesMap = React.useMemo(() => {
    const map = new Map<string, JadwalPublikWithSlot[]>();

    const parsedSchedules = schedules.map((s) => {
      const start = parseLocalDateStart(s.tanggal_masuk);
      const end = parseLocalDateEnd(s.tanggal_keluar);
      return {
        schedule: s,
        startTime: start.getTime(),
        endTime: end.getTime(),
      };
    });

    for (const { days } of calendarDaysByMonth) {
      for (const dayItem of days) {
        const dateKey = dayItem.date.toDateString();
        const targetTime = dayItem.date.getTime();

        const active: JadwalPublikWithSlot[] = [];
        for (const { schedule, startTime, endTime } of parsedSchedules) {
          if (targetTime >= startTime && targetTime <= endTime) {
            active.push(schedule);
          }
        }

        if (active.length > 0) {
          map.set(dateKey, active);
        }
      }
    }
    return map;
  }, [schedules, calendarDaysByMonth]);

  const getActiveBatchesForDate = React.useCallback(
    (date: Date): JadwalPublikWithSlot[] => {
      return activeBatchesMap.get(date.toDateString()) || [];
    },
    [activeBatchesMap]
  );

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const selectedDateBatches = selectedDate ? getActiveBatchesForDate(selectedDate) : [];
  const selectedDateTotalCount = selectedDateBatches.reduce((sum, b) => sum + Number(b.jumlah_peserta), 0);

  const sortedSchedulesForTable = React.useMemo(() => {
    return [...schedules].sort((a, b) => parseLocalDateStart(b.tanggal_masuk).getTime() - parseLocalDateStart(a.tanggal_masuk).getTime());
  }, [schedules]);

  return (
    <section id="jadwal-pkl" className="bg-surface-0 text-text-primary py-24 px-6 md:px-12 border-t border-border-subtle relative overflow-hidden scroll-mt-20">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-glow rounded-full blur-[128px] -translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight">Kalender Ketersediaan PKL</h2>
            <p className="text-sm text-text-secondary mt-1">Transparansi jadwal praktik kerja lapangan yang telah terkonfirmasi.</p>
          </div>
          <div className="flex bg-surface-2 p-1 rounded-lg border border-border-base shrink-0">
            <button
              onClick={() => setCurrentView("calendar")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 ${
                currentView === "calendar" ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Kalender Visual
            </button>
            <button
              onClick={() => setCurrentView("list")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-300 ${
                currentView === "list" ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Daftar Tabel
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-status-reject/10 border border-status-reject/20 text-status-reject rounded-xl p-4 text-center text-sm mb-8 animate-slide-in-error">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="bg-surface-2 animate-pulse h-4 rounded w-full"></div>
            <div className="bg-surface-2 animate-pulse h-4 rounded w-5/6"></div>
            <div className="bg-surface-2 animate-pulse h-4 rounded w-4/6"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {currentView === "calendar" ? (
              <div className="space-y-10">
                <div className="flex justify-start items-center gap-6">
                  <button
                    onClick={() => setSelectedYear((y) => y - 1)}
                    className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-base transition-all duration-200 text-text-secondary hover:text-text-primary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <h3 className="text-2xl font-black text-text-primary tracking-wider font-mono-data">{selectedYear}</h3>

                  <button
                    onClick={() => setSelectedYear((y) => y + 1)}
                    className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-base transition-all duration-200 text-text-secondary hover:text-text-primary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {calendarDaysByMonth.map(({ month, days }) => {
                    return (
                      <div
                        key={month.index}
                        className="bg-surface-1 border border-border-base p-4 rounded-2xl flex flex-col items-center shadow-sm hover:border-border-strong transition-all duration-300"
                      >
                        <h4 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-widest font-mono-data">{month.name}</h4>

                        <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center w-full mb-3">
                          {["M", "S", "S", "R", "K", "J", "S"].map((day, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-text-muted uppercase font-mono-data">
                              {day}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-0 text-center w-full">
                          {days.map((dayItem, dayIdx) => {
                            if (!dayItem.isCurrentMonth) {
                              return <div key={dayIdx} className="w-full h-10" />;
                            }

                            const activeBatches = getActiveBatchesForDate(dayItem.date);
                            const activeCount = activeBatches.reduce((sum, b) => sum + Number(b.jumlah_peserta), 0);

                            const dayIsToday = isToday(dayItem.date);
                            const dayIsSelected = isSelected(dayItem.date);

                            const isFull = activeCount >= kapasitasMaksimal;
                            const isCurrent = dayItem.isCurrentMonth;

                            const lineBgColor = activeBatches.some((b) => b.isBerjalan) ? "bg-status-active" : "bg-status-pending";

                            const lineOpacity = isFull ? (isCurrent ? "opacity-75" : "opacity-35") : isCurrent ? "opacity-20" : "opacity-10";

                            const dateTextColor = dayIsToday
                              ? "text-text-primary font-bold"
                              : isFull && isCurrent
                                ? "text-text-primary font-bold"
                                : dayItem.isCurrentMonth
                                  ? "text-text-secondary"
                                  : "text-text-muted opacity-40";

                            return (
                              <div key={dayIdx} className="relative group flex flex-col items-center w-full">
                                <button
                                  onClick={() => setSelectedDate(dayItem.date)}
                                  className="w-full h-10 flex flex-col justify-center items-center transition-all duration-300 relative border border-transparent z-10"
                                >
                                  {activeCount > 0 && <div className={`absolute inset-0 ${lineBgColor} ${lineOpacity} transition-all duration-300 z-0`} />}

                                  <div className="absolute inset-0 bg-surface-3 opacity-0 group-hover:opacity-50 transition-opacity duration-200 pointer-events-none z-10" />

                                  {dayIsSelected && <div className="absolute inset-0 ring-1 ring-brand ring-inset z-20 pointer-events-none" />}

                                  <div
                                    className={`relative z-10 w-full h-full flex items-center justify-center ${dayIsToday ? "ring-2 ring-brand ring-inset rounded-sm bg-brand/10 text-brand font-bold" : ""}`}
                                  >
                                    <span className={`text-xs font-mono-data ${dateTextColor}`}>{dayItem.day}</span>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="bg-surface-1 border border-border-base p-6 md:p-8 rounded-2xl w-full shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                      <div>
                        <p className="text-brand font-bold text-xs uppercase tracking-wider font-mono-data">DETAIL JADWAL HARIAN</p>
                        <h4 className="text-xl font-bold text-text-primary mt-1">{formatDateIndo(selectedDate)}</h4>
                      </div>
                      <div className="bg-surface-2 border border-border-base px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[10px] text-text-muted font-bold uppercase font-mono-data">Total Kuota:</span>
                        <span
                          className={`font-mono-data text-sm font-bold ${
                            selectedDateTotalCount >= kapasitasMaksimal
                              ? "text-status-reject"
                              : selectedDateTotalCount >= kapasitasMaksimal * 0.8
                                ? "text-status-pending"
                                : "text-status-active"
                          }`}
                        >
                          {selectedDateTotalCount} / {kapasitasMaksimal}
                        </span>
                      </div>
                    </div>

                    {selectedDateBatches.length === 0 ? (
                      <div className="text-center py-6 text-text-muted text-sm">
                        Tidak ada kelompok PKL yang aktif pada tanggal ini. Kuota tersedia sepenuhnya ({kapasitasMaksimal} slot).
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {selectedDateBatches.map((item) => {
                          return (
                            <div key={item.pengajuan_id} className="bg-surface-2 border border-border-base p-5 rounded-xl flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-3 gap-2">
                                  <h5 className="font-bold text-text-primary text-sm leading-snug">{item.institusi}</h5>
                                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface-3 text-[10px] font-bold font-mono-data text-text-secondary uppercase">
                                    {item.jenis_kelompok}
                                  </span>
                                </div>
                                <div className="space-y-2 text-xs text-text-secondary">
                                  <p>
                                    <strong className="text-text-muted font-semibold uppercase text-[9px] tracking-wide block">Program Studi</strong>
                                    <span className="font-medium text-text-primary">{item.program_studi}</span>
                                  </p>
                                  <p>
                                    <strong className="text-text-muted font-semibold uppercase text-[9px] tracking-wide block">Durasi PKL</strong>
                                    <span className="font-medium font-mono-data text-text-primary">
                                      {formatDateStringIndo(item.tanggal_masuk)} - {formatDateStringIndo(item.tanggal_keluar)}
                                    </span>
                                  </p>
                                  <p>
                                    <strong className="text-text-muted font-semibold uppercase text-[9px] tracking-wide block">Status</strong>
                                    <BadgeStatus status={item.isBerjalan ? "aktif" : "menunggu"} size="sm" />
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 pt-3 border-t border-border-subtle flex justify-between items-center text-xs">
                                <span className="text-text-muted">Jumlah Peserta:</span>
                                <span className="font-bold text-text-primary font-mono-data">{item.jumlah_peserta} Orang</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <div className="overflow-hidden border border-border-base rounded-xl bg-surface-1">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-muted text-[10px] font-bold uppercase tracking-wider font-mono-data bg-surface-2/50">
                          <th className="p-4">Institusi</th>
                          <th className="p-4">Program Studi</th>
                          <th className="p-4">Tanggal Masuk</th>
                          <th className="p-4">Tanggal Keluar</th>
                          <th className="p-4">Kapasitas</th>
                          <th className="p-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {schedules.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-text-muted text-xs">
                              Tidak ada data jadwal PKL.
                            </td>
                          </tr>
                        ) : (
                          sortedSchedulesForTable.map((item) => {
                            return (
                              <tr key={item.pengajuan_id} className="hover:bg-surface-2 transition-colors">
                                <td className="p-4">
                                  <div className="font-semibold text-text-primary">{item.institusi}</div>
                                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium mt-0.5">{item.jenis_kelompok}</div>
                                </td>
                                <td className="p-4 text-text-secondary text-sm">{item.program_studi}</td>
                                <td className="p-4 font-mono-data text-text-primary text-sm">
                                  <span className="font-mono-data">{formatDateStringIndo(item.tanggal_masuk)}</span>
                                </td>
                                <td className="p-4 font-mono-data text-text-primary text-sm">
                                  <span className="font-mono-data">{formatDateStringIndo(item.tanggal_keluar)}</span>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono-data text-xs text-text-secondary">{item.jumlah_peserta} Orang</span>
                                </td>
                                <td className="p-4 text-right">
                                  <BadgeStatus status={item.isBerjalan ? "aktif" : "menunggu"} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default JadwalPublik;
