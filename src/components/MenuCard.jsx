import { formatPrice, getMenuImage } from "../utils";
import { Quantity } from "./Quantity";

export function MenuCard({ item, count, onChange }) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[#e2d3bf] bg-[#fffaf2]/80 shadow-sm shadow-[#6f4a2d]/5">
      <div className="grid grid-cols-[108px_1fr] gap-3 p-3 sm:grid-cols-[140px_1fr]">
        <img
          src={getMenuImage(item)}
          alt={item.name}
          loading="lazy"
          className="h-full min-h-[132px] w-full rounded-[1rem] object-cover"
        />
        <div className="flex min-w-0 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold leading-tight">{item.name}</h3>
                  {item.vegetarian && <span className="rounded-full bg-[#e4efd9] px-2 py-0.5 text-xs font-semibold text-[#45652b]">veg</span>}
                  {item.spicy && <span className="rounded-full bg-[#f4dfd2] px-2 py-0.5 text-xs font-semibold text-[#9a3a1f]">{item.spicy === "hot" ? "остро" : "умеренно"}</span>}
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-[#7b6657]">{[item.weight, item.description, item.variants].filter(Boolean).join(" • ")}</p>
              </div>
            </div>
            <p className="mt-3 text-lg font-bold">{formatPrice(item.price)}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] uppercase tracking-[0.16em] text-[#9b806a]">{item.category}</span>
            {count > 0 ? (
              <Quantity count={count} onMinus={() => onChange(item.id, -1)} onPlus={() => onChange(item.id, 1)} />
            ) : (
              <button onClick={() => onChange(item.id, 1)} className="shrink-0 rounded-full bg-[#321c12] px-4 py-2 text-sm font-semibold text-white">Добавить</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
