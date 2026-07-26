interface UsageTooltipProps {
  costumeNames: string[];
}

export default function UsageTooltip({ costumeNames }: UsageTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <span className="cursor-default rounded-md bg-[#F3F0EF] px-2 py-1 text-[11px] font-semibold text-[#6E4B4B]">
        {costumeNames.length} disfraz{costumeNames.length === 1 ? '' : 'ces'}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-64 -translate-x-1/2 rounded-lg border border-[#E6D0C9] bg-white px-3 py-2 text-xs text-[#4A1F1F] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {costumeNames.length > 0 ? (
          <ul className="space-y-1">
            {costumeNames.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        ) : (
          'Sin disfraces asociados'
        )}
      </span>
    </span>
  );
}
