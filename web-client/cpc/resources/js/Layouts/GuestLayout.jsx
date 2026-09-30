export default function GuestLayout({ children }) {
    return (
        <div
            className="
            min-h-screen
            flex
            items-center
            justify-center
            bg-[#081B29]
            bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]
            bg-[size:40px_40px]
            px-6
        "
        >
            {children}
        </div>
    );
}