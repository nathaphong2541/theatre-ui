# e-Accountant Portal (ไอซ์ซึ)

> Angular + DevExtreme + Tailwind UI for e-Accountant workflows (สมัคร/ตรวจสอบ/จัดการข้อมูลผู้ทำบัญชี) พร้อม JWT Auth และการเชื่อมต่อระบบภายนอก (SSO, DOPA/DBD) — **Thai/English README**

---

## 🔰 Overview

**ไอซ์ซึ** เป็นเว็บแอปพลิเคชั่นที่พัฒนาโดย **Angular 20 (standalone)** ร่วมกับ **TailwindCSS**, และ **JWT Auth** และ UI รองรับมือถือเต็มรูปแบบ.

### Key Features


* 🔐 **Auth + JWT/Refresh**: Login, Refresh, Logout (Blacklist access token), ระดับสิทธิ์ (Role)
* 🌐 **2 ภาษา (TH/EN)**: `app-language-menu` + `LocaleSwitcherService` (ไม่ใช้ Angular i18n), แยกไฟล์ `th.json` / `en.json`
* 📱 **Responsive Header/Sidebar**: Hamburger, ย้ายเมนูหลักเข้า dropdown บน mobile, ภาพพื้นหลังหลายชั้น
* 🧩 **Standalone Components**: `bootstrapApplication` (ไม่มี NgModule), lazy routes

---

## ⚙️ Requirements

* **Angular CLI** 20+
* **Package manager**: npm หรือ pnpm (แนะนำ pnpm)

## 📧 Contact

* ทีมพัฒนา ไอซ์ซึ — เปิด issue ใน GitHub หรือส่งอีเมลที่ทีมโปรเจกต์ (ภายใน)

> ปรับชื่อรีโป/URL/API ใน README ให้ตรงกับสิ่งแวดล้อมของคุณก่อนเผยแพร่
