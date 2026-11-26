import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from '@/componentes/ui/badge';
const TONO_CLASES = {
    success: 'bg-transparent border-success text-success',
    warning: 'bg-transparent border-warning text-warning',
    neutral: 'bg-transparent border-silver-deep text-silver-deep',
};
export function EstadoBadge({ estado, colorMap, }) {
    const tono = colorMap[estado] ?? 'neutral';
    return (_jsx(Badge, { variant: "outline", className: `rounded-sharp uppercase tracking-wide text-xs font-bold ${TONO_CLASES[tono]}`, children: estado }));
}
