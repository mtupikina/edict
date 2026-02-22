import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app-layout.component.html',
  host: { class: 'block' },
})
export class AppLayoutComponent {}
