import { useState } from "react";
import { categories } from "./data";
import { formatPrice, supabase } from "./utils/supabase";

export function AdminPanel({ items, setItems, contacts, setContacts }) {
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [editing, setEditing] = useState(null);
  const [changePwd, setChangePwd] = useState({ current: "", newPwd: "", confirm: "" });

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f1e7] p-5 text-[#261711]">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl shadow-[#6f4a2d]/5">
          <h2 className="mb-4 text-center text-2xl font-bold">Вход в панель</h2>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
            className="mb-4 w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-4 text-lg outline-none focus:border-[#8b5e35]"
          />
          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-[#321c12] p-4 font-bold text-white transition hover:bg-[#4a2a1a]"
          >
            Войти
          </button>
          <button onClick={() => window.location.hash = ""} className="mt-4 block w-full text-center text-sm text-[#7b6657] hover:text-black">
            Вернуться на сайт
          </button>
        </div>
      </div>
    );
  }

  function handleLogin() {
    if (password === (contacts.adminPassword || "Xatuna$david12")) {
      setIsAuth(true);
    } else {
      alert("Неверный пароль");
    }
  }

  function handlePasswordChange() {
    const actualPassword = contacts.adminPassword || "Xatuna$david12";
    if (changePwd.current !== actualPassword) {
      return alert("Текущий пароль введен неверно!");
    }
    if (changePwd.newPwd !== changePwd.confirm) {
      return alert("Новые пароли не совпадают!");
    }
    if (changePwd.newPwd.length < 5) {
      return alert("Пароль должен быть не короче 5 символов!");
    }
    setContacts({ ...contacts, adminPassword: changePwd.newPwd });
    setChangePwd({ current: "", newPwd: "", confirm: "" });
    alert("✅ Пароль успешно изменен!");
  }

  async function handleSave(item) {
    if (!item.name && !item.title) {
      return alert("Заполните название");
    }
    if (!item.price || !item.category) {
      return alert("Заполните цену и категорию");
    }

    const payload = {
      title: item.name || item.title,
      price: Number(item.price),
      category: item.category,
      weight: item.weight || "",
      description: item.description || "",
      image: item.image || "",
      spicy: item.spicy || null,
      vegetarian: Boolean(item.vegetarian)
    };

    // Проверяем, является ли ID числом в базе (старые дефолтные элементы с текстовыми ID просто создадут новую запись в базе)
    const isNumericId = item.id && !isNaN(Number(item.id));

    if (isNumericId) {
      const { error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', Number(item.id));

      if (error) {
        console.error("Ошибка при обновлении в Supabase:", error);
        return alert("Не удалось сохранить изменения в базе данных.");
      }

      setItems(items.map((i) => (i.id === item.id ? { ...item, ...payload, name: payload.title } : i)));
    } else {
      const { data, error } = await supabase
        .from('items')
        .insert([payload])
        .select();

      if (error) {
        console.error("Ошибка при добавлении в Supabase:", error);
        return alert("Не удалось добавить блюдо в базу данных.");
      }

      if (data && data.length > 0) {
        const newItem = { ...data[0], name: data[0].title };
        setItems([newItem, ...items.filter(i => i.id !== item.id)]);
      }
    }

    setEditing(null);
  }

  async function handleDelete(id) {
    if (window.confirm("Точно удалить это блюдо?")) {
      const isNumericId = id && !isNaN(Number(id));
      
      if (isNumericId) {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', Number(id));

        if (error) {
          console.error("Ошибка при удалении из Supabase:", error);
          return alert("Не удалось удалить блюдо из базы данных.");
        }
      }

      setItems(items.filter((i) => i.id !== id));
    }
  }

  function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const max = 800;
        if (width > max || height > max) {
          if (width > height) { height = Math.round(height * max / width); width = max; }
          else { width = Math.round(width * max / height); height = max; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, (base64) => {
      if (editing) setEditing({ ...editing, image: base64 });
    });
  }

  const allCategories = Array.from(new Set(items.map(i => i.category)));
  const combinedCategories = Array.from(new Set([...categories, ...allCategories]));
  
  const itemsByCategory = combinedCategories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f8f1e7] pb-20 text-[#261711]">
      <header className="sticky top-0 z-40 bg-[#321c12] px-5 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-bold">Панель управления</h1>
          <button onClick={() => window.location.hash = ""} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30">
            На сайт
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-3xl px-5">
        <div className="mb-6 rounded-2xl bg-[#fffaf2] p-5 shadow-sm border border-[#e2d3bf]">
          <h2 className="text-lg font-bold">Настройки сайта</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Телефон (Звонки)</label>
              <input className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={contacts.phone} onChange={(e) => setContacts({...contacts, phone: e.target.value})} placeholder="+7495..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">WhatsApp (только цифры)</label>
              <input className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={contacts.whatsapp} onChange={(e) => setContacts({...contacts, whatsapp: e.target.value})} placeholder="7903..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Адрес</label>
              <input className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={contacts.address} onChange={(e) => setContacts({...contacts, address: e.target.value})} />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Ссылка на Яндекс Карты / 2ГИС</label>
            <input className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={contacts.mapUrl || ""} onChange={(e) => setContacts({...contacts, mapUrl: e.target.value})} placeholder="https://yandex.ru/maps/..." />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Главная картинка сайта (сверху)</label>
            <div className="flex gap-2">
              <label className="flex-shrink-0 cursor-pointer rounded-lg bg-[#e2d3bf] px-4 py-2 text-sm font-semibold text-[#321c12] hover:bg-[#d5c3aa] transition">
                Изменить фото
                <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  compressImage(file, (base64) => setContacts({ ...contacts, heroImage: base64 }));
                }} />
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-[#fffaf2] p-5 shadow-sm border border-[#e2d3bf]">
          <h2 className="text-lg font-bold">Управление меню</h2>
          <p className="mt-2 text-sm text-[#7b6657]">
            Все изменения сохраняются в единую онлайн-базу Supabase и будут доступны с любых устройств.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => setEditing({ category: categories[0] })} className="rounded-full bg-[#2f6b3f] px-5 py-3 text-sm font-bold text-white shadow-lg">
              + Добавить блюдо
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-[#fffaf2] p-5 shadow-sm border border-[#e2d3bf]">
          <h2 className="text-lg font-bold">Смена пароля администратора</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Текущий пароль</label>
              <input type="password" placeholder="Старый пароль" className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={changePwd.current} onChange={(e) => setChangePwd({...changePwd, current: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Новый пароль</label>
              <input type="password" placeholder="Новый пароль" className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={changePwd.newPwd} onChange={(e) => setChangePwd({...changePwd, newPwd: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7b6657]">Повторите новый пароль</label>
              <input type="password" placeholder="Новый пароль еще раз" className="w-full rounded-lg border border-[#d5c3aa] bg-white p-2 text-sm outline-none" value={changePwd.confirm} onChange={(e) => setChangePwd({...changePwd, confirm: e.target.value})} />
            </div>
          </div>
          <button onClick={handlePasswordChange} className="mt-4 rounded-lg bg-[#321c12] px-4 py-2 text-sm font-bold text-white">Изменить пароль</button>
        </div>

        <div className="space-y-8">
          {combinedCategories.map((cat) => {
            const catItems = itemsByCategory[cat];
            if (!catItems || catItems.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-3 text-xl font-bold text-[#8b5e35] border-b border-[#e2d3bf] pb-2">{cat}</h3>
                <div className="space-y-3">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div className="min-w-0 pr-4">
                        <p className="font-bold truncate">{item.name || item.title}</p>
                        <p className="text-sm text-[#7b6657]">{formatPrice(item.price)} {item.weight && `• ${item.weight}`}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => setEditing(item)} className="rounded-lg bg-[#efe3d2] px-3 py-2 text-sm font-bold text-[#321c12]">Изменить</button>
                        <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-5 text-2xl font-bold">{editing.id ? "Редактировать блюдо" : "Новое блюдо"}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Название *</label>
                <input className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 outline-none focus:border-[#8b5e35]" placeholder="Например: Шашлык из курицы" value={editing.name || editing.title || ""} onChange={(e) => setEditing({...editing, name: e.target.value, title: e.target.value})} />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Категория *</label>
                <input 
                  list="categories-list" 
                  className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 outline-none focus:border-[#8b5e35]" 
                  placeholder="Выберите или напишите новую..." 
                  value={editing.category || ""} 
                  onChange={(e) => setEditing({...editing, category: e.target.value})} 
                />
                <datalist id="categories-list">
                  {combinedCategories.map(c => <option key={c} value={c} />)}
                </datalist>
                <p className="mt-1 text-xs text-[#7b6657]">Выберите из списка или впишите свою собственную категорию.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Цена (₽) *</label>
                  <input type="number" className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 outline-none focus:border-[#8b5e35]" placeholder="500" value={editing.price || ""} onChange={(e) => setEditing({...editing, price: e.target.value})} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Вес/Объем</label>
                  <input className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 outline-none focus:border-[#8b5e35]" placeholder="300 г" value={editing.weight || ""} onChange={(e) => setEditing({...editing, weight: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Описание (ингредиенты)</label>
                <textarea className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 outline-none focus:border-[#8b5e35]" rows={3} placeholder="Необязательно..." value={editing.description || ""} onChange={(e) => setEditing({...editing, description: e.target.value})} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#7b6657]">Фото блюда</label>
                
                {editing.image && editing.image.startsWith("data:image") && (
                  <div className="mb-3 relative w-full h-40 rounded-xl overflow-hidden border border-[#d5c3aa]">
                    <img src={editing.image} alt="Превью" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setEditing({...editing, image: ""})}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <label className="flex-shrink-0 cursor-pointer rounded-xl bg-[#e2d3bf] px-4 py-3 font-semibold text-[#321c12] hover:bg-[#d5c3aa] transition">
                    Загрузить из галереи
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <input className="w-full rounded-xl border border-[#d5c3aa] bg-[#fffaf2] p-3 text-sm outline-none focus:border-[#8b5e35]" placeholder="или вставьте ссылку (https://...)" value={editing.image || ""} onChange={(e) => setEditing({...editing, image: e.target.value})} />
                </div>
                <p className="mt-1 text-xs text-[#7b6657]">Оставьте пустым, чтобы использовалось стандартное фото для категории.</p>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#7b6657]">
                  <input type="checkbox" checked={editing.vegetarian || false} onChange={(e) => setEditing({...editing, vegetarian: e.target.checked})} className="h-5 w-5 rounded border-[#d5c3aa]" />
                  Вегетарианское
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#7b6657]">
                  <select className="rounded border border-[#d5c3aa] bg-[#fffaf2] p-1 text-sm outline-none" value={editing.spicy || ""} onChange={(e) => setEditing({...editing, spicy: e.target.value})}>
                    <option value="">Не острое</option>
                    <option value="mild">Умеренно</option>
                    <option value="hot">Очень острое</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex-1 rounded-xl bg-[#efe3d2] p-4 font-bold text-[#321c12]" onClick={() => setEditing(null)}>Отмена</button>
              <button className="flex-1 rounded-xl bg-[#321c12] p-4 font-bold text-white" onClick={() => handleSave(editing)}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}