// src/app/member/all-search/all-search.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { InfoSearchComponent } from '../info-search.component';

// ✅ path นี้ให้ตรงกับที่จริงของ InfoSearchComponent

@Component({
  selector: 'app-all-search',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoSearchComponent],
  templateUrl: './all-search.component.html',
  styleUrls: ['./all-search.component.css'],
})
export class AllSearchComponent {
  constructor(private router: Router) { }

  backToLanding() {
    // ถ้าหน้าแรกของคุณคือ / ก็ใช้แบบนี้
    // ถ้าอยากกลับไปหน้าอื่น เปลี่ยน path ได้เลย
    this.router.navigate(['/']);
  }
}
