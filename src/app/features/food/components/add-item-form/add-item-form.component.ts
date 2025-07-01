import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodListingService } from '../../services/food-listing.service';

export interface NewMenuItem {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  isVeg: boolean;
  basePrice: number;
  packingCharges: number;
  images: {
    primary: string;
    gallery?: string[];
  };
  spiceLevel: 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
  tags: string[];
  allergens: string[];
  isRecommended: boolean;
  servingSize: number;
}

@Component({
  selector: 'app-add-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add New Item to {{ selectedCategoryName }}</h2>
          <button class="close-btn" (click)="onClose()">×</button>
        </div>

        <form class="add-item-form" (ngSubmit)="onSubmit()" #itemForm="ngForm">
          <div class="form-group">
            <label for="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              [(ngModel)]="formData.name"
              required
              placeholder="Enter item name"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea
              id="description"
              name="description"
              [(ngModel)]="formData.description"
              required
              placeholder="Enter item description"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="basePrice">Price (₹) *</label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                [(ngModel)]="formData.basePrice"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="packingCharges">Packing Charges (₹)</label>
              <input
                type="number"
                id="packingCharges"
                name="packingCharges"
                [(ngModel)]="formData.packingCharges"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="imageUrl">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              [(ngModel)]="formData.images.primary"
              placeholder="https://example.com/image.jpg"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="servingSize">Serving Size</label>
              <input
                type="number"
                id="servingSize"
                name="servingSize"
                [(ngModel)]="formData.servingSize"
                min="1"
                placeholder="1"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="spiceLevel">Spice Level</label>
              <select
                id="spiceLevel"
                name="spiceLevel"
                [(ngModel)]="formData.spiceLevel"
                class="form-select"
              >
                <option value="MILD">Mild</option>
                <option value="MEDIUM">Medium</option>
                <option value="HOT">Hot</option>
                <option value="EXTRA_HOT">Extra Hot</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="isVeg"
                [(ngModel)]="formData.isVeg"
              />
              Vegetarian
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="isRecommended"
                [(ngModel)]="formData.isRecommended"
              />
              Recommended
            </label>
          </div>

          <div class="form-group">
            <label for="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              [(ngModel)]="tagsInput"
              placeholder="spicy, popular, healthy"
              class="form-input"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="onClose()">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!itemForm.valid || isSubmitting()"
            >
              {{ isSubmitting() ? 'Adding...' : 'Add Item' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './add-item-form.component.scss'
})
export class AddItemFormComponent {
  @Input() selectedCategoryId: string = '';
  @Input() selectedCategoryName: string = '';
  @Output() itemAdded = new EventEmitter<NewMenuItem>();
  @Output() close = new EventEmitter<void>();

  isSubmitting = signal(false);
  tagsInput = '';

  formData: NewMenuItem = {
    name: '',
    description: '',
    categoryId: '',
    isVeg: true,
    basePrice: 0,
    packingCharges: 0,
    images: {
      primary: '',
      gallery: []
    },
    spiceLevel: 'MILD',
    tags: [],
    allergens: [],
    isRecommended: false,
    servingSize: 1
  };

  ngOnInit() {
    this.formData.categoryId = this.selectedCategoryId;
  }

  onSubmit() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    // Process tags
    this.formData.tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Add default vegetarian tag
    if (this.formData.isVeg && !this.formData.tags.includes('vegetarian')) {
      this.formData.tags.push('vegetarian');
    }

    this.itemAdded.emit(this.formData);
  }

  onClose() {
    this.close.emit();
  }
}
