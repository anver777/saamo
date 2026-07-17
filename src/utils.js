import { itemImages, categoryImages } from "./data";

export function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function getMenuImage(item) {
  return item.image || itemImages[item.id] || categoryImages[item.category] || "/images/menu-hot.jpg";
}
