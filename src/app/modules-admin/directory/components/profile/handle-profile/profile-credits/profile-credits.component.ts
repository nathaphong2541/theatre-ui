import { Component, signal } from '@angular/core';

export interface Credit {
  id: number;
  company: string;
  jobTitle: string;
  venue: string;
  location: string;

  // year / flags
  startYear?: number | null;
  endYear?: number | null;
  current?: boolean;
  internship?: boolean;
  fellowship?: boolean;

  // multi-select
  departments: string[];
  positions: string[];
  skills: string[];
}


@Component({
  selector: 'app-profile-credits',
  imports: [],
  templateUrl: './profile-credits.component.html',
  styleUrl: './profile-credits.component.css'
})
export class ProfileCreditsComponent {

  // เก็บรายการ credit ทั้งหมด (จำกัด 5)
  credits = signal<Credit[]>([]);

  // สำหรับ popup
  showCreditModal = signal(false);
  editingIndex = signal<number | null>(null);
  draftCredit = signal<Credit | null>(null);

  get canAddMore(): boolean {
    return this.credits().length < 5;
  }

  // กดปุ่ม + New Credit
  addCredit() {
    if (!this.canAddMore) return;

    const empty: Credit = {
      id: Date.now(),
      company: '',
      jobTitle: '',
      venue: '',
      location: '',
      startYear: null,
      endYear: null,
      current: false,
      internship: false,
      fellowship: false,
      departments: [],
      positions: [],
      skills: [],
    };

    this.editingIndex.set(null);
    this.draftCredit.set(empty);
    this.showCreditModal.set(true);
  }

  // คลิกแก้ไข credit เดิม
  editCredit(index: number) {
    const item = this.credits()[index];
    this.editingIndex.set(index);
    // clone เพื่อไม่ให้แก้ array ตรง ๆ
    this.draftCredit.set({
      ...item,
      departments: [...item.departments],
      positions: [...item.positions],
      skills: [...item.skills],
    });
    this.showCreditModal.set(true);
  }

  // กดปุ่มลบ credit
  removeCredit(index: number) {
    const arr = [...this.credits()];
    arr.splice(index, 1);
    this.credits.set(arr);
  }

  // เมื่อกด Save ใน popup
  saveDraftCredit(updated: Credit) {
    const index = this.editingIndex();
    const arr = [...this.credits()];

    if (index === null) {
      arr.push(updated);
    } else {
      arr[index] = updated;
    }

    this.credits.set(arr);
    this.closeModal();
  }

  closeModal() {
    this.showCreditModal.set(false);
    this.draftCredit.set(null);
    this.editingIndex.set(null);
  }

  // helper เอาไปใช้ใน template แสดง text ปี
  formatYears(c: Credit): string {
    if (c.current) {
      return `${c.startYear ?? ''} – Present`;
    }
    if (c.startYear && c.endYear) {
      return `${c.startYear} – ${c.endYear}`;
    }
    return '';
  }
}
