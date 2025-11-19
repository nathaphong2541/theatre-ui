import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';   // ⭐ ต้องมี

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [
    CommonModule,
    RouterModule,   // ⭐ เพิ่มตรงนี้
  ]
})
export class FooterComponent implements OnInit {

  public year: number = new Date().getFullYear();

  homeTitle = $localize`:@@homeTitle:ไทย`;

  constructor() { }

  ngOnInit(): void { }
}
