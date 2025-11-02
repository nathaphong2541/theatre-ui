import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: '[info-hero-section]',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './info-hero-section.component.html',
  styleUrl: './info-hero-section.component.css'
})
export class InfoHeroSectionComponent {
  q: string = '';

  constructor(private router: Router) { }

}