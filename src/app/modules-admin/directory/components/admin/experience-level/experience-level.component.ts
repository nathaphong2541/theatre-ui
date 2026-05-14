// experience-level.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MasterService } from '../master.service';


@Component({
  selector: 'app-experience-level',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './experience-level.component.html',
  styleUrl: './experience-level.component.css',
})
export class ExperienceLevelComponent implements OnInit {
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
    this.masterService.getExperienceLevels().subscribe({
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
    this.masterService.getExperienceLevelById(id).subscribe({
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
      this.masterService
        .updateExperienceLevel(this.editingId, payload as any)
        .subscribe(() => {
          this.closeModal();
          this.loadData();
        });

      return;
    }

    this.masterService
      .createExperienceLevel(payload as any)
      .subscribe(() => {
        this.closeModal();
        this.loadData();
      });
  }

  delete(id: number): void {
    if (!confirm('Delete item ?')) return;

    this.masterService.deleteExperienceLevel(id).subscribe(() => {
      this.loadData();
    });
  }

  closeModal(): void {
    this.showModal = false;
  }
}