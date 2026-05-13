import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    // =========================================================
    // USER MENU
    // =========================================================
    {
      group: $localize`:@@menu_group_directory:Directory`,
      separator: true,

      role: 'USER',

      items: [
        {
          icon: 'assets/icons/heroicons/outline/user.svg',
          label: $localize`:@@menu_directory_profile:Profile`,
          route: '/directory/profile',

          role: 'USER',
        },

        {
          icon: 'assets/icons/heroicons/outline/document-text.svg',
          label: $localize`:@@menu_directory_script:Script`,
          route: '/directory/script',

          role: 'USER',
        },

        {
          icon: 'assets/icons/heroicons/outline/cog-6-tooth.svg',
          label: 'Setting',
          route: '/directory/setting',

          role: 'USER',
        },
      ],
    },

    // =========================================================
    // MASTER DATA
    // =========================================================
    {
      group: 'Master Data',
      separator: true,

      role: 'ADMIN',

      items: [
        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Department',
          route: '/admin/department',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Work Locations',
          route: '/admin/work-locations',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Unions / Guilds / Memberships',
          route: '/admin/memberships',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Experience Levels',
          route: '/admin/experience-levels',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Partner Directories',
          route: '/admin/partner-directories',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Gender Identity',
          route: '/admin/gender-identity',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Personal Identity',
          route: '/admin/personal-identity',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Racial Identity',
          route: '/admin/racial-identity',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Profession',
          route: '/admin/profession',

          role: 'ADMIN',
        },
      ],
    },
  ];
}
