export default function TextInputField({
    label,
    type = "text",
    value,
    onChange,
    error,
    placeholder = "",
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
                {label}
            </label>

            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition
                ${
                    error
                        ? "border-red-500 focus:ring-2 focus:ring-red-300"
                        : "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                }`}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
