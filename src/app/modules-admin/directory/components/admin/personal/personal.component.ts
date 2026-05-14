// personal.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../master.service';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css',
})
export class PersonalComponent implements OnInit {
  private masterService = inject(MasterService);
  private fb = inject(FormBuilder);

  dataList: any[] = [];

  showModal = false;
  editingId: number | null = null;

  form = this.fb.group({
    nameTh: ['', Validators.required],
    nameEn: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.masterService.getPersonalIdentities().subscribe({
      next: (res) => {
        this.dataList = res.items || [];
      },
    });
  }

  openCreate(): void {
    this.editingId = null;

    this.form.reset({
      nameTh: '',
      nameEn: '',
      description: '',
    });

    this.showModal = true;
  }

  openEdit(id: number): void {
    this.masterService.getPersonalIdentityById(id).subscribe({
      next: (res) => {
        this.editingId = id;

        this.form.patchValue({
          nameTh: res.nameTh,
          nameEn: res.nameEn,
          description: res.description,
        });

        this.showModal = true;
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();

    if (this.editingId) {
      this.masterService.updatePersonalIdentity(this.editingId, payload as any).subscribe(() => {
        this.closeModal();
        this.loadData();
      });

      return;
    }

    this.masterService.createPersonalIdentity(payload as any).subscribe(() => {
      this.closeModal();
      this.loadData();
    });
  }

  delete(id: number): void {
    if (!confirm('Delete item ?')) return;

    this.masterService.deletePersonalIdentity(id).subscribe(() => {
      this.loadData();
    });
  }

  closeModal(): void {
    this.showModal = false;
  }
}
