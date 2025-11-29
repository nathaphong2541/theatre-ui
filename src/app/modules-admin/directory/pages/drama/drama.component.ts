import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ListDramaComponent } from '../../components/drama/list-drama/list-drama.component';

@Component({
  selector: 'app-drama',
  imports: [CommonModule, ListDramaComponent],
  templateUrl: './drama.component.html',
  styleUrl: './drama.component.css'
})
export class DramaComponent {

}
