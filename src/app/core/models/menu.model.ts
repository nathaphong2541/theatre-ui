export interface MenuItem {
  group: string;

  separator?: boolean;
  selected?: boolean;
  active?: boolean;

  role?: 'ADMIN' | 'USER';

  items: Array<SubMenuItem>;
}

export interface SubMenuItem {
  icon?: string;
  label?: string;
  route?: string | null;

  expanded?: boolean;
  active?: boolean;

  role?: 'ADMIN' | 'USER';

  children?: Array<SubMenuItem>;
}
