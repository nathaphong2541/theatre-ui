import { Injectable, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Menu } from 'src/app/core/constants/menu';
import { MenuItem, SubMenuItem } from 'src/app/core/models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService implements OnDestroy {
  private _showSidebar = signal(true);
  private _showMobileMenu = signal(false);
  private _pagesMenu = signal<MenuItem[]>([]);
  private _subscription = new Subscription();

  constructor(private router: Router) {
    this._pagesMenu.set(Menu.pages);

    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this._pagesMenu().forEach((menu) => {
          let activeGroup = false;

          menu.items.forEach((subMenu) => {
            const active = this.isActive(subMenu.route); // ✅ route จะถูก resolve ตาม lang
            subMenu.expanded = active;
            subMenu.active = active;

            if (active) activeGroup = true;

            if (subMenu.children) {
              this.expand(subMenu.children);
            }
          });

          menu.active = activeGroup;
        });
      }
    });

    this._subscription.add(sub);
  }

  // ====== getters/setters ======
  get showSideBar() {
    return this._showSidebar();
  }
  get showMobileMenu() {
    return this._showMobileMenu();
  }
  get pagesMenu() {
    return this._pagesMenu();
  }

  set showSideBar(value: boolean) {
    this._showSidebar.set(value);
  }
  set showMobileMenu(value: boolean) {
    this._showMobileMenu.set(value);
  }

  public toggleSidebar() {
    this._showSidebar.set(!this._showSidebar());
  }

  public toggleMenu(menu: SubMenuItem) {
    this.showSideBar = true;

    const updatedMenu = this._pagesMenu().map((menuGroup) => ({
      ...menuGroup,
      items: menuGroup.items.map((item) => ({
        ...item,
        expanded: item === menu ? !item.expanded : false,
      })),
    }));

    this._pagesMenu.set(updatedMenu);
  }

  public toggleSubMenu(submenu: SubMenuItem) {
    submenu.expanded = !submenu.expanded;
  }

  private expand(items: Array<any>) {
    items.forEach((item) => {
      item.expanded = this.isActive(item.route); // ✅ resolve ตาม lang เช่นกัน
      if (item.children) this.expand(item.children);
    });
  }

  public isActive(route: any): boolean {
    const resolved = this.resolveRoute(route);

    return this.router.isActive(this.router.createUrlTree([resolved]), {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  // ✅ ดึง lang จาก URL ปัจจุบัน (ตัด #/? ออกก่อน)
  private getLangPrefix(): 'th' | 'en' | null {
    const pathOnly = this.router.url.split('#')[0].split('?')[0];
    const seg0 = pathOnly.split('/').filter(Boolean)[0];
    return seg0 === 'th' || seg0 === 'en' ? seg0 : null;
  }

  private resolveRoute(route?: string | null): string {
    if (!route) return '/';

    // เผื่อบางอันเป็น /en/... หรือ /th/... อยู่แล้ว
    if (/^\/(en|th)(\/|$)/.test(route)) return route;

    const lang = this.getLangPrefix();
    if (!lang) return route;

    return `/${lang}${route.startsWith('/') ? '' : '/'}${route}`;
  }

  // ✅ ใช้ใน template: [routerLink]="menuService.link(item.route)"
  public link(route?: string | null): any[] {
    return [this.resolveRoute(route)];
  }

  // ✅ (optional) ใช้ตอนคลิกแบบ navigate โดยตรง
  public navigate(route?: string | null) {
    this.router.navigateByUrl(this.resolveRoute(route));
  }
}
