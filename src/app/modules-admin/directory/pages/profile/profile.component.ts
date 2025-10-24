import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ListProfileComponent } from '../../components/profile/list-profile/list-profile.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ListProfileComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

}
