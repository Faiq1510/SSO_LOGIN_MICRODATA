export default function SectionHeader({ title, sub }) {
    return (
        <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {sub && (
                <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            )}
        </div>
    );
}