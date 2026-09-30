export default function TableCard({ title, action, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <h2 className="font-bold">{title}</h2>
                {action}
            </div>
            <div className="px-5 pb-5 pt-4">
                {children}
            </div>
        </div>
    );
}