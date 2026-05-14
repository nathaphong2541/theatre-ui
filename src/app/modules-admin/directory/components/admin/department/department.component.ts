// department.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../master.service';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department.component.html',
  styleUrl: './department.component.css',
})
export class DepartmentComponent implements OnInit {
  private masterService = inject(MasterService);
  private fb = inject(FormBuilder);

  departments: any[] = [];
  positions: any[] = [];

  loading = false;

  showDepartmentModal = false;
  showPositionModal = false;

  editingDepartmentId: number | null = null;
  editingPositionId: number | null = null;

  departmentForm = this.fb.group({
    nameTh: ['', Validators.required],
    nameEn: ['', Validators.required],
    description: [''],
  });

  positionForm = this.fb.group({
    nameTh: ['', Validators.required],
    nameEn: ['', Validators.required],
    description: [''],
    departmentId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPositions();
  }

  // =========================================================
  // LOAD
  // =========================================================

  // loadDepartments()

  loadDepartments(): void {
    this.loading = true;

    this.masterService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // loadPositions()

  loadPositions(): void {
    this.masterService.getPositions().subscribe({
      next: (res) => {
        this.positions = res.items || [];
      },
    });
  }

  // =========================================================
  // DEPARTMENT
  // =========================================================

  openCreateDepartment(): void {
    this.editingDepartmentId = null;

    this.departmentForm.reset({
      nameTh: '',
      nameEn: '',
      description: '',
    });

    this.showDepartmentModal = true;
  }

  openEditDepartment(id: number): void {
    this.masterService.getDepartmentById(id).subscribe({
      next: (res) => {
        this.editingDepartmentId = id;

        this.departmentForm.patchValue({
          nameTh: res.nameTh,
          nameEn: res.nameEn,
          description: res.description,
        });

        this.showDepartmentModal = true;
      },
    });
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const payload = this.departmentForm.getRawValue();

    if (this.editingDepartmentId) {
      this.masterService.updateDepartment(this.editingDepartmentId, payload as any).subscribe({
        next: () => {
          this.closeDepartmentModal();
          this.loadDepartments();
        },
      });

      return;
    }

    this.masterService.createDepartment(payload as any).subscribe({
      next: () => {
        this.closeDepartmentModal();
        this.loadDepartments();
      },
    });
  }

  deleteDepartment(id: number): void {
    const confirmDelete = confirm('Delete department ?');

    if (!confirmDelete) return;

    this.masterService.deleteDepartment(id).subscribe({
      next: () => {
        this.loadDepartments();
      },
    });
  }

  closeDepartmentModal(): void {
    this.showDepartmentModal = false;
  }

  // =========================================================
  // POSITION
  // =========================================================

  openCreatePosition(departmentId?: number): void {
    this.editingPositionId = null;

    this.positionForm.reset({
      nameTh: '',
      nameEn: '',
      description: '',
      departmentId: departmentId || null,
    });

    this.showPositionModal = true;
  }

  openEditPosition(id: number): void {
    this.masterService.getPositionById(id).subscribe({
      next: (res) => {
        this.editingPositionId = id;

        this.positionForm.patchValue({
          nameTh: res.nameTh,
          nameEn: res.nameEn,
          description: res.description,
          departmentId: res.departmentId,
        });

        this.showPositionModal = true;
      },
    });
  }

  savePosition(): void {
    if (this.positionForm.invalid) {
      this.positionForm.markAllAsTouched();
      return;
    }

    const payload = this.positionForm.getRawValue();

    if (this.editingPositionId) {
      this.masterService.updatePosition(this.editingPositionId, payload as any).subscribe({
        next: () => {
          this.closePositionModal();
          this.loadPositions();
        },
      });

      return;
    }

    this.masterService.createPosition(payload as any).subscribe({
      next: () => {
        this.closePositionModal();
        this.loadPositions();
      },
    });
  }

  deletePosition(id: number): void {
    const confirmDelete = confirm('Delete position ?');

    if (!confirmDelete) return;

    this.masterService.deletePosition(id).subscribe({
      next: () => {
        this.loadPositions();
      },
    });
  }

  closePositionModal(): void {
    this.showPositionModal = false;
  }

  // =========================================================
  // HELPER
  // =========================================================

  getDepartmentName(id: number): string {
    const department = this.departments.find((x) => x.id === id);

    return department?.nameTh || '-';
  }

  // department.component.ts

  expandedDepartmentId: number | null = null;

  toggleExpand(id: number): void {
    if (this.expandedDepartmentId === id) {
      this.expandedDepartmentId = null;
      return;
    }

    this.expandedDepartmentId = id;
  }

  getPositionsByDepartment(departmentId: number): any[] {
    return this.positions.filter((x) => x.departmentId === departmentId);
  }
}
