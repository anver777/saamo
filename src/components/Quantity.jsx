export function Quantity({ count, onMinus, onPlus }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#efe3d2] p-1">
      <button onClick={onMinus} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg font-bold" aria-label="Уменьшить">-</button>
      <span className="min-w-6 text-center text-sm font-bold">{count}</span>
      <button onClick={onPlus} className="grid h-8 w-8 place-items-center rounded-full bg-[#321c12] text-lg font-bold text-white" aria-label="Увеличить">+</button>
    </div>
  );
}
