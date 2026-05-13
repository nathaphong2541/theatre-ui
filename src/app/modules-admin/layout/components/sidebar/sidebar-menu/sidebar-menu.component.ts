// sidebar-menu.component.ts

import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { AngularSvgIconModule } from 'angular-svg-icon';

import { MenuItem, SubMenuItem } from 'src/app/core/models/menu.model';

import { MenuService } from '../../../services/menu.service';

import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';

import { AuthService } from 'src/app/modules/auth/service/auth.service';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    NgFor,
    NgClass,
    AngularSvgIconModule,
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    SidebarSubmenuComponent,
  ],
})
export class SidebarMenuComponent implements OnInit {
  public filteredMenu: MenuItem[] = [];

  constructor(public menuService: MenuService, public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      if (!user) {
        this.filteredMenu = [];
        return;
      }

      this.filteredMenu = this.menuService.pagesMenu
        .filter((group) => {
          if (group.role && group.role !== user.role) {
            return false;
          }

          return true;
        })
        .map((group) => ({
          ...group,

          items: group.items.filter((item) => {
            if (item.role && item.role !== user.role) {
              return false;
            }

            return true;
          }),
        }));
    });
  }

  public toggleMenu(subMenu: SubMenuItem) {
    this.menuService.toggleMenu(subMenu);
  }

  public onItemClick(item: SubMenuItem, event: MouseEvent) {
    if (item.children && item.children.length) {
      this.toggleMenu(item);
      return;
    }

    event.stopPropagation();
  }
}
