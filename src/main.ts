import { enableProdMode, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import { loadTranslations } from '@angular/localize';

import localeTh from '@angular/common/locales/th';
import localeEn from '@angular/common/locales/en';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';

// ลงทะเบียนข้อมูล locale (วันที่/ตัวเลข ฯลฯ)
registerLocaleData(localeTh, 'th');
registerLocaleData(localeEn, 'en');

if (environment.production) {
  enableProdMode();
  if (window) selfXSSWarning();
}

/** อ่าน base href จาก <base href> และ normalize */
function getBaseHref(): string {
  const baseEl = document.querySelector('base');
  let b = baseEl?.getAttribute('href') || '/';
  if (!b.startsWith('/')) b = '/' + b;
  if (!b.endsWith('/')) b = b + '/';
  return b;
}

/** ลบ base ออกจาก pathname -> ได้พาธภายในแอป */
function stripBase(pathname: string): string {
  const base = getBaseHref().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const p = pathname.replace(new RegExp('^' + base), '/');
  return p.startsWith('/') ? p.slice(1) : p;
}

/** ต่อ base กลับเข้าไป */
function withBase(path: string): string {
  const base = getBaseHref();
  const p = path.startsWith('/') ? path.slice(1) : path;
  return base + p;
}

// ตรวจจับภาษา จาก segment แรกของ path: /th/... หรือ /en/...
// **default = 'en'**
function detectLocale(): 'th' | 'en' {
  const seg = (stripBase(location.pathname).split('/')[0] || '').toLowerCase();
  return seg === 'th' ? 'th' : 'en';
}

/** ถ้ายังไม่มี segment ภาษา ให้ redirect ไป /en/... เสมอ (ก่อน bootstrap) */
(function ensureDefaultEnglishAtUrl() {
  const inner = stripBase(location.pathname);
  const segs = inner.split('/').filter(Boolean);
  const first = segs[0]?.toLowerCase();

  if (first !== 'th' && first !== 'en') {
    const nextInner = ['en', ...segs].join('/');
    const nextUrl = withBase(nextInner) + location.search + location.hash;
    // ใช้ replace เพื่อไม่ทิ้ง history ซ้อน
    location.replace(nextUrl);
  }
})();

async function bootstrap() {
  const locale = detectLocale(); // จะเป็น 'en' เสมอในหน้าแรกเพราะเราบังคับ redirect ไว้แล้ว

  // ตั้ง <html lang="..."> ให้ตรงกับภาษา
  document.documentElement.lang = locale;

  // โหลดคำแปลแบบ runtime จาก /assets/i18n/messages.{lang}.json (คำนึงถึง base)
  try {
    const base = getBaseHref();
    const url = new URL(`assets/i18n/messages.${locale}.json`, location.origin + base).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) {
      const dict = await res.json();
      loadTranslations(dict);
    } else {
      console.warn(`i18n: missing messages for locale "${locale}"`);
    }
  } catch (e) {
    console.warn('i18n: failed to load runtime messages', e);
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(BrowserModule, AppRoutingModule),
      provideAnimations(),
      { provide: LOCALE_ID, useValue: locale }, // ให้ Angular Pipes ใช้ locale ที่ถูกต้อง
    ],
  });
}

bootstrap().catch(err => console.error(err));

function selfXSSWarning() {
  setTimeout(() => {
    console.log(
      '%c** STOP **',
      'font-weight:bold; font: 2.5em Arial; color: white; background-color: #e11d48; padding: 5px 15px; border-radius: 25px;'
    );
    console.log(
      '\n%cThis is a browser feature intended for developers. Using this console may allow attackers to impersonate you and steal your information using an attack called Self-XSS. Do not enter or paste code that you do not understand.',
      'font-weight:bold; font: 2em Arial; color: #e11d48;'
    );
  });
}
