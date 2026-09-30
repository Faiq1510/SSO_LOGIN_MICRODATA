import { UserCog, Shield, Eye } from "lucide-react";

const STYLES = {
    "Super Admin": "bg-orange-50 text-orange-700 ring-orange-200",
    Admin: "bg-sky-50 text-sky-700 ring-sky-200",
    Owner: "bg-violet-50 text-violet-700 ring-violet-200",
};

const ICONS = {
    "Super Admin": UserCog,
    Admin: Shield,
    Owner: Eye,
};

export default function RoleBadge({ role }) {
    const Icon = ICONS[role] ?? Shield;
    const style = STYLES[role] ?? "bg-slate-50 text-slate-700 ring-slate-200";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${style}`}
        >
            <Icon size={10} />
            {role}
        </span>
    );
}