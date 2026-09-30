import React from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const STATUS_COLORS = {
    Aman: "#10b981",
    Warning: "#f59e0b",
    Boros: "#ef4444",
    Selesai: "#0ea5e9",
};

/**
 * Lazy-loaded chart section untuk tab Operasional.
 * Menerima data yang sudah diolah dari OperasionalContent.
 */
export default function OperasionalCharts({
    statusDistribution,
    filteredRows,
    filteredStok,
}) {
    return (
        <div className="grid gap-5 xl:grid-cols-3">
            {/* Pie Chart – Distribusi Status Unit */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-bold">Distribusi Status Unit</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sebaran status pemakaian material unit terfilter.
                </p>
                <div className="mt-4 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                            >
                                {statusDistribution.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={STATUS_COLORS[entry.name]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    {statusDistribution.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Tidak ada unit yang cocok.
                        </p>
                    )}
                </div>
            </div>

            {/* Bar Chart – Progress Tiap Unit */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-bold">Progress Tiap Unit</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Persentase progress pembangunan per unit.
                </p>
                <div className="mt-4 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredRows}
                            margin={{ left: -20, bottom: 10 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                            />
                            <XAxis
                                dataKey="nama_unit"
                                tick={{ fontSize: 10 }}
                                interval={0}
                                angle={-30}
                                textAnchor="end"
                                height={40}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                                {filteredRows.map((row) => (
                                    <Cell
                                        key={row.id}
                                        fill={
                                            STATUS_COLORS[row.statusMaterial] ??
                                            "#10b981"
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {filteredRows.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Tidak ada unit yang cocok.
                        </p>
                    )}
                </div>
            </div>

            {/* Bar Chart – Level Stok Gudang */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-bold">Level Stok Gudang</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Sisa stok material teratas (mengikuti pencarian).
                </p>
                <div className="mt-4 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredStok.slice(0, 8)}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                                horizontal={false}
                            />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="nama"
                                tick={{ fontSize: 10 }}
                                width={80}
                            />
                            <Tooltip />
                            <Bar dataKey="sisaStok" radius={[0, 6, 6, 0]}>
                                {filteredStok.slice(0, 8).map((s) => (
                                    <Cell
                                        key={s.nama}
                                        fill={
                                            s.persen > 50
                                                ? "#10b981"
                                                : s.persen > 25
                                                  ? "#f59e0b"
                                                  : "#ef4444"
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {filteredStok.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Belum ada data stok gudang.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
