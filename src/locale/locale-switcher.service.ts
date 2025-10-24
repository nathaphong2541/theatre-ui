import { Injectable, inject } from '@angular/core';
import { PlatformLocation, DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LocaleSwitcherService {
    private doc = inject(DOCUMENT);
    private platformLocation = inject(PlatformLocation);

    /** base href ปัจจุบันจาก <base href>, normalized ให้ขึ้นต้น/ลงท้ายด้วย / */
    private base(): string {
        let b = this.platformLocation.getBaseHrefFromDOM() || '/';
        if (!b.startsWith('/')) b = '/' + b;
        if (!b.endsWith('/')) b = b + '/';
        return b;
    }

    /** ลบ base ออกจาก pathname ให้เหลือพาธภายในแอป (ไม่มี leading slash) */
    private stripBase(pathname: string): string {
        const base = this.base().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const p = pathname.replace(new RegExp('^' + base), '/');
        return p.startsWith('/') ? p.slice(1) : p;
    }

    /** เติม base กลับให้เป็น path เต็ม */
    private withBase(path: string): string {
        const base = this.base();
        const p = path.startsWith('/') ? path.slice(1) : path;
        return base + p;
    }

    /** อ่าน locale จาก segment แรกของพาธ (default = en) */
    currentLocale(): 'th' | 'en' {
        const inner = this.stripBase(this.doc.location.pathname);
        const [first] = inner.split('/').filter(Boolean);
        return first === 'th' ? 'th' : 'en';
    }

    /** สลับ locale โดย "แทนที่" segment แรก (ไม่ต่อพ่วง/ไม่ซ้อน) */
    switchTo(locale: 'th' | 'en') {
        const inner = this.stripBase(this.doc.location.pathname);
        const segs = inner.split('/').filter(Boolean);

        if (segs.length === 0) segs.push(locale);
        else segs[0] = locale;

        const nextInner = segs.join('/');
        const nextUrl = this.withBase(nextInner) + this.doc.location.search + this.doc.location.hash;
        this.doc.location.assign(nextUrl);
    }

    /**
     * เริ่มต้นที่ /en เสมอ ถ้า URL ยังไม่มี segment ภาษา
     * เรียกครั้งเดียวตอนบูตแอป (เช่น APP_INITIALIZER)
     */
    ensureDefaultEnglish() {
        const inner = this.stripBase(this.doc.location.pathname);
        const segs = inner.split('/').filter(Boolean);
        const first = segs[0];

        if (first !== 'th' && first !== 'en') {
            const nextInner = ['en', ...segs].join('/');
            const nextUrl = this.withBase(nextInner) + this.doc.location.search + this.doc.location.hash;
            this.doc.location.replace(nextUrl); // replace เพื่อไม่ทิ้งประวัติซ้อน
        }
    }
}
