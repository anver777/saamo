import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { categories, menuItems, popularIds, phone, whatsapp, address, mapUrl, adminPassword } from "./data";
import { formatPrice } from "./utils";
import { MenuCard } from "./components/MenuCard";
import { Quantity } from "./components/Quantity";
import { AdminPanel } from "./Admin";
import { supabase } from './utils/supabase';

function App() {
  const [storedItems, setStoredItems] = useState(() => {
    const saved = localStorage.getItem("saamo_menu");
    return saved ? JSON.parse(saved) : menuItems;
  });

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem("saamo_contacts");
    return saved ? JSON.parse(saved) : { phone, whatsapp, address, mapUrl, heroImage: "/images/saamo-hero.jpg", adminPassword };
  });

  // Загрузка данных из Supabase при старте
  useEffect(() => {
    async function fetchItemsFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*');

        if (!error && data && data.length > 0) {
          // Приводим названия полей Supabase к формату приложения (title -> name)
          const formattedItems = data.map(item => ({
            ...item,
            name: item.title || item.name
          }));
          setStoredItems(formattedItems);
        }
      } catch (err) {
        console.error("Ошибка при получении данных из Supabase:", err);
      }
    }

    fetchItemsFromSupabase();
  }, []);

  const dynamicCategories = useMemo(() => {
    const existing = new Set(storedItems.map((item) => item.category));
    const ordered = categories.filter((c) => existing.has(c) && c !== "Популярное");
    const custom = Array.from(existing).filter((c) => !categories.includes(c));
    return ["Популярное", ...ordered, ...custom];
  }, [storedItems]);

  useEffect(() => {
    try {
      localStorage.setItem("saamo_menu", JSON.stringify(storedItems));
    } catch (e) {
      alert("Не удалось сохранить меню: переполнена память. Картинки слишком тяжелые.");
    }
  }, [storedItems]);

  useEffect(() => {
    try {
      localStorage.setItem("saamo_contacts", JSON.stringify(contacts));
    } catch (e) {
      alert("Не удалось сохранить картинку: она слишком тяжелая.");
    }
  }, [contacts]);

  const [currentHash, setCurrentHash] = useState(window.location.hash);
  
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [activeCategory, setActiveCategory] = useState("Популярное");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState({});
  const [orderOpen, setOrderOpen] = useState(false);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return storedItems.filter((item) => {
      const name = item.name || item.title || "";
      const inSearch = !normalized || `${name} ${item.description ?? ""} ${item.category}`.toLowerCase().includes(normalized);
      if (normalized) return inSearch;
      return activeCategory === "Популярное" ? popularIds.has(item.id) : item.category === activeCategory;
    });
  }, [activeCategory, query, storedItems]);

  const orderItems = useMemo(() => {
    return Object.entries(order)
      .map(([id, count]) => ({ item: storedItems.find((menuItem) => menuItem.id === id || menuItem.id === Number(id)), count }))
      .filter((entry) => Boolean(entry.item) && entry.count > 0);
  }, [order, storedItems]);

  const total = orderItems.reduce((sum, entry) => sum + (Number(entry.item.price) || 0) * entry.count, 0);
  const orderCount = orderItems.reduce((sum, entry) => sum + entry.count, 0);
  const whatsappText = encodeURIComponent(
    `Здравствуйте! Хочу уточнить заказ в Саамо:\n${orderItems.map(({ item, count }) => `${count} x ${item.name || item.title} - ${formatPrice((item.price || 0) * count)}`).join("\n")}\nИтого: ${formatPrice(total)}`,
  );

  function changeCount(id, delta) {
    setOrder((current) => {
      const nextCount = Math.max(0, (current[id] ?? 0) + delta);
      const next = { ...current };
      if (nextCount === 0) delete next[id];
      else next[id] = nextCount;
      return next;
    });
  }

  if (currentHash === "#admin") {
    return <AdminPanel items={storedItems} setItems={setStoredItems} contacts={contacts} setContacts={setContacts} />;
  }

  return (
    <main className="min-h-screen bg-[#f8f1e7] text-[#261711]">
      <section className="relative min-h-[92vh] overflow-hidden bg-[#1c120d] text-white">
        <motion.img
          key={contacts.heroImage || "/images/saamo-hero.jpg"}
          initial={{ scale: 1.08, opacity: 0.45 }}
          animate={{ scale: 1, opacity: 0.72 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          src={contacts.heroImage || "/images/saamo-hero.jpg"}
          alt="Ресторан грузинской кухни Саамо в Москве, хинкальная на Первомайской"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-[#1c120d]" />
        <div className="relative z-10 flex min-h-[92vh] flex-col justify-between px-5 py-6">
          <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-between text-sm">
            <span className="tracking-[0.38em] text-white/75">ХИНКАЛЬНАЯ</span>
          </motion.div>

          <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }} className="max-w-sm pb-10">
            <p className="mb-3 text-sm uppercase tracking-[0.32em] text-[#d7ad72]">Москва, Измайлово</p>
            <h1 className="font-serif text-6xl font-semibold leading-[0.9] tracking-tight">Саамо</h1>
            <p className="mt-5 text-xl leading-7 text-white/88">Грузинская кухня, хинкали, шашлык и домашняя выпечка на Первомайской.</p>
            <div className="mt-7 flex gap-3">
              <a href="#menu" className="rounded-full bg-[#f1c27a] px-5 py-3 text-sm font-semibold text-[#261711] shadow-lg shadow-black/25">Смотреть меню</a>
              <a href={`tel:${contacts.phone}`} className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur">Позвонить</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="menu" className="relative z-20 -mt-7 rounded-t-[2rem] bg-[#f8f1e7] px-4 pb-32 pt-5">
        <motion.div initial={{ y: 22, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#8b5e35]">Онлайн-меню</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Выберите блюда</h2>
            </div>
            <button onClick={() => setOrderOpen(true)} className="rounded-full bg-[#321c12] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#321c12]/20">
              Заказ {orderCount > 0 ? orderCount : ""}
            </button>
          </div>

          <div className="sticky top-0 z-30 -mx-4 bg-[#f8f1e7]/95 px-4 pb-3 pt-2 backdrop-blur-xl">
            <label className="relative block">
              <span className="sr-only">Поиск по меню</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти хинкали, шашлык, чай..."
                className="h-12 w-full rounded-full border border-[#d5c3aa] bg-white/70 px-5 text-base outline-none transition focus:border-[#8b5e35] focus:bg-white"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-sm font-bold text-[#8b5e35] hover:bg-black/5"
                  aria-label="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </label>
            <AnimatePresence>
              {!query && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {dynamicCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category ? "bg-[#321c12] text-white" : "bg-white/70 text-[#5c4638]"}`}
                    >
                      {category}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${query}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-5 space-y-3"
            >
              {visibleItems.length === 0 ? (
                <div className="py-14 text-center text-[#7b6657]">Ничего не найдено. Попробуйте другое название.</div>
              ) : (
                visibleItems.map((item) => <MenuCard key={item.id} item={item} count={order[item.id] ?? 0} onChange={changeCount} />)
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="bg-[#321c12] px-5 py-10 text-[#fff7ec]">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d7ad72]">Контакты</p>
          <h2 className="mt-2 text-3xl font-semibold">Саамо ждет гостей</h2>
          <div className="mt-6 space-y-4 text-base text-white/85">
            <p>{contacts.address}</p>
            <p>Доставка: <a href={`tel:${contacts.phone}`} className="font-semibold text-white">{contacts.phone}</a></p>
            <p>WhatsApp: <a href={`https://wa.me/${contacts.whatsapp}`} className="font-semibold text-white">{contacts.whatsapp}</a></p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="rounded-full bg-[#f1c27a] px-5 py-3 text-sm font-semibold text-[#261711]" href={contacts.mapUrl || `https://yandex.ru/maps/?text=${encodeURIComponent(contacts.address)}`} target="_blank" rel="noreferrer">Маршрут</a>
            <a className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white" href={`https://wa.me/${contacts.whatsapp}`} target="_blank" rel="noreferrer">Написать</a>
          </div>
          
          <div className="mt-12 border-t border-white/10 pt-6 text-center">
            <a href="#admin" className="text-xs text-white/30 transition hover:text-white/60">Панель управления меню</a>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {orderCount > 0 && !orderOpen && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setOrderOpen(true)}
            className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full bg-[#321c12] px-5 py-4 text-left text-white shadow-2xl shadow-black/30"
          >
            <span className="text-sm font-semibold">Ваш выбор: {orderCount} поз.</span>
            <span className="text-base font-bold">{formatPrice(total)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOrderOpen(false)}>
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(event) => event.stopPropagation()}
              className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[2rem] bg-[#fff8ef] p-5 text-[#261711]"
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#d5c3aa]" />
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Ваш выбор</h2>
                <button onClick={() => setOrderOpen(false)} className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm font-semibold">Закрыть</button>
              </div>
              {orderItems.length === 0 ? (
                <p className="py-10 text-[#7b6657]">Добавьте блюда из меню. Это не оформляет заказ автоматически, а помогает быстро отправить список в WhatsApp.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {orderItems.map(({ item, count }) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[#e2d3bf] pb-3">
                      <div>
                        <p className="font-semibold">{item.name || item.title}</p>
                        <p className="text-sm text-[#7b6657]">{count} x {formatPrice(item.price)}</p>
                      </div>
                      <Quantity count={count} onMinus={() => changeCount(item.id, -1)} onPlus={() => changeCount(item.id, 1)} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 text-xl font-bold">
                    <span>Итого</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <a href={`https://wa.me/${contacts.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer" className="mt-5 block rounded-full bg-[#2f6b3f] px-5 py-4 text-center font-semibold text-white">
                    Отправить в WhatsApp
                  </a>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;