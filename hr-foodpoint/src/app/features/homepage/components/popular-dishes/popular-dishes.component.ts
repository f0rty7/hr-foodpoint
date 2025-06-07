import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Dish {
  id: number;
  name: string;
  image: string;
  description: string;
}

@Component({
  selector: 'app-popular-dishes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="popular-dishes">
      <h2 class="section-title">Popular Dishes</h2>
      <div class="dishes-grid">
        @for (dish of dishes(); track dish.id) {
          <div class="dish-card">
            <div class="dish-image" [style.background-image]="'url(' + dish.image + ')'">
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './popular-dishes.component.scss'
})
export class PopularDishesComponent {
  dishes = signal<Dish[]>([
    {
      id: 1,
      name: 'Paneer Butter Masala',
      image: 'https://images.unsplash.com/photo-1701579231378-3726490a407b?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Creamy black lentil curry'
    },
    {
      id: 2,
      name: 'Dal Rice',
      image: 'https://plus.unsplash.com/premium_photo-1699293238823-7f56fe53ae3e?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Rich tomato-based chicken curry'
    },
    {
      id: 3,
      name: 'Samosas',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop&crop=center',
      description: 'Spinach curry with cottage cheese'
    }
  ]);
}
