import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { InfoHeroSectionComponent } from '../../components/info-hero-section/info-hero-section.component';
import { InfoAboutComponent } from '../../components/info-about/info-about.component';
import { InfoNewsComponent } from '../../components/info-news/info-news.component';
import { InfoSearchComponent } from '../../components/info-search/info-search.component';
import { InfoDonetComponent } from '../../components/info-donet/info-donet.component';

@Component({
  selector: 'app-main-pages',
  imports: [
    CommonModule,
    InfoHeroSectionComponent,
    InfoAboutComponent,
    InfoNewsComponent,
    InfoSearchComponent,
    InfoDonetComponent
  ],
  templateUrl: './main-pages.component.html',
  styleUrl: './main-pages.component.css'
})
export class MainPagesComponent {

  /** ควบคุมการแสดงปุ่มขึ้นบนสุด */
  showScrollTop = false;

  // ฟัง event scroll ของ window
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const yOffset = window.scrollY || document.documentElement.scrollTop;
    this.showScrollTop = yOffset > 300; // แสดงเมื่อเลื่อนเกิน 300px
  }

  /** เลื่อนกลับไปบนสุด */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
