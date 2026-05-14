// work-localtion.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../master.service';

@Component({
  selector: 'app-work-localtion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './work-localtion.component.html',
  styleUrl: './work-localtion.component.css',
})
export class WorkLocaltionComponent implements OnInit {
  private masterService = inject(MasterService);
  private fb = inject(FormBuilder);

  loading = false;

  workLocations: any[] = [];

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

  // =========================================================
  // LOAD
  // =========================================================

  loadData(): void {
    this.loading = true;

    this.masterService.getWorkLocations().subscribe({
      next: (res) => {
        this.workLocations = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // =========================================================
  // CREATE
  // =========================================================

  openCreate(): void {
    this.editingId = null;

    this.form.reset({
      nameTh: '',
      nameEn: '',
      description: '',
    });

    this.showModal = true;
  }

  // =========================================================
  // EDIT
  // =========================================================

  openEdit(id: number): void {
    this.masterService.getWorkLocationById(id).subscribe({
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

  // =========================================================
  // SAVE
  // =========================================================

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    if (this.editingId) {
      this.masterService.updateWorkLocation(this.editingId, payload as any).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
      });

      return;
    }

    this.masterService.createWorkLocation(payload as any).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  delete(id: number): void {
    const confirmDelete = confirm('Delete work location ?');

    if (!confirmDelete) return;

    this.masterService.deleteWorkLocation(id).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  // =========================================================
  // CLOSE
  // =========================================================

  closeModal(): void {
    this.showModal = false;
  }
}
