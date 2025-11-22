import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [
    CommonModule,
    RouterModule,
  ]
})
export class FooterComponent implements OnInit {

  public year: number = new Date().getFullYear();
  homeTitle = $localize`:@@homeTitle:ไทย`;

  constructor(private router: Router) { }

  ngOnInit(): void { }

  /** ดึง prefix ภาษา เช่น /en/... -> 'en' */
  private getLangPrefix(): string | null {
    const path = this.router.url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  /** ใช้ใน template */
  public langPrefix(): string | null {
    return this.getLangPrefix();
  }

  /** Helper สำหรับลิงก์ไปหน้า Home */
  public homeLink() {
    const lang = this.getLangPrefix();
    return lang ? ['/', lang] : ['/'];
  }
}
