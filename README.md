# Telegram Keyword Monitor & Lead Generator

Ushbu bot Telegram guruhlari va kanallarini real-vaqt rejimida kuzatib boradi, kalit so'zlar bo'yicha filtrlangan xabarlarni bazaga saqlaydi va menejerga bildirishnoma yuboradi.

## 🚀 O'rnatish yo'riqnomasi

### 1. Talablar
- Node.js (v16 yoki undan yuqori)
- PostgreSQL bazasi

### 2. Loyihani yuklash va sozlash
1. Terminalda loyiha papkasiga kiring.
2. Kerakli kutubxonalarni o'rnating:
   ```bash
   npm install
   ```
3. `.env.example` faylini `.env` deb nomlang va ichidagi ma'lumotlarni to'ldiring:
   - `API_ID` va `API_HASH` ni [my.telegram.org](https://my.telegram.org) saytidan oling.
   - Database (PostgreSQL) ulanish ma'lumotlarini kiriting.
   - `KEYWORDS` va `STOP_WORDS` larni vergul bilan ajratib yozing.

### 3. Telegram Sessiyasini yaratish
GramJS (MTProto) xavfsiz ulanish uchun `STRING_SESSION` dan foydalanadi. Uni bir marta yaratib olish kerak:
```bash
npm run session
```
Ekranda ko'rsatilgan kodni nusxalab, `.env` faylidagi `STRING_SESSION` qismiga qo'ying.

### 4. Botni ishga tushirish
```bash
npm start
```

## 🛠 Texnik imkoniyatlar
- **MTProto Engine**: Foydalanuvchi akkaunti nomidan ishlaydi (User-bot).
- **PostgreSQL**: Barcha topilgan leadlar `leads` jadvalida saqlanadi.
- **Reliability**: FloodWait va kutilmagan uzilishlar avtomatik boshqariladi.
- **Logging**: Barcha jarayonlar `combined.log` va xatoliklar `error.log` fayllariga yoziladi.

## 👤 Muallif
Antigravity AI (Google Deepmind) tomonidan tayyorlandi.
