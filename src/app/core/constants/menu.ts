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

          label: $localize`:@@menu_directory_setting:Setting`,

          route: '/directory/setting',

          role: 'USER',
        },
      ],
    },

    // =========================================================
    // MASTER DATA
    // =========================================================
    {
      group: $localize`:@@menu_group_master_data:Master Data`,

      separator: true,

      role: 'ADMIN',

      items: [
        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_department:Department`,

          route: '/admin/department',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_work_locations:Work Locations`,

          route: '/admin/work-locations',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_memberships:Unions`,

          route: '/admin/unions',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_experience_levels:Experience Levels`,

          route: '/admin/experience-levels',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_partner_directories:Partner Directories`,

          route: '/admin/partner-directories',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_gender_identity:Gender Identity`,

          route: '/admin/gender-identity',

          role: 'ADMIN',
        },

        // {
        //   icon: 'assets/icons/heroicons/outline/folder.svg',

        //   label: $localize`:@@menu_admin_personal_identity:Personal Identity`,

        //   route: '/admin/personal-identity',

        //   role: 'ADMIN',
        // },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_racial_identity:Racial Identity`,

          route: '/admin/racial-identity',

          role: 'ADMIN',
        },

        {
          icon: 'assets/icons/heroicons/outline/folder.svg',

          label: $localize`:@@menu_admin_profession:Profession`,

          route: '/admin/profession',

          role: 'ADMIN',
        },
      ],
    },
  ];
}
