import { jsx as _jsx } from "react/jsx-runtime";
export function ErrorBanner({ message }) {
    return (_jsx("div", { className: "bg-graphite border-l-2 border-warning text-warning px-4 py-3 rounded-sharp text-sm", children: message }));
}
