import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

function formatRupiah(value) {
    const rounded = Number(value) || 0;
    return rounded.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

/**
 * Lazy-loaded chart section untuk tab Keuangan.
 * Menerima cashflowWeekly dari KeuanganContent.
 */
export default function KeuanganCharts({ cashflowWeekly = [] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-bold">Tren Cashflow Mingguan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Grafik perbandingan kas masuk dan kas keluar setiap
                        minggu.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
                        Masuk
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />{" "}
                        Keluar
                    </span>
                </div>
            </div>

            <div className="px-5 py-5">
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cashflowWeekly}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                            />
                            <XAxis
                                dataKey="weekLabel"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) =>
                                    `${(v / 1000000).toFixed(0)}jt`
                                }
                            />
                            <Tooltip
                                formatter={(value) => formatRupiah(value)}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="masuk"
                                name="Masuk"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="keluar"
                                name="Keluar"
                                stroke="#ef4444"
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {cashflowWeekly.length === 0 && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Tidak ada data minggu ini.
                    </p>
                )}
            </div>
        </div>
    );
}
