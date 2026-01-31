import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    {
      group: $localize`:@@menu_group_directory:Directory`,
      separator: true,
      items: [
        // {
        //   icon: 'assets/icons/heroicons/outline/download.svg',
        //   label: $localize`:@@menu_directory_dashboard:Dashboard`,
        //   route: '/directory/dashboard', // ✅ ไม่ fix en
        // },
        {
          icon: 'assets/icons/heroicons/outline/gift.svg',
          label: $localize`:@@menu_directory_profile:Profile`,
          route: '/directory/profile',
        },
        {
          icon: 'assets/icons/heroicons/outline/gift.svg',
          label: $localize`:@@menu_directory_script:Script`,
          route: '/directory/script',
        },
        {
          icon: 'assets/icons/heroicons/outline/users.svg',
          label: $localize`:@@menu_directory_setting:Setting`,
          route: '/directory/setting',
        },
      ],
    },
  ];
}
