import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  basePrice: number;
  packingCharges: number;
  isVeg: boolean;
  images: {
    primary: string;
    gallery?: string[];
  };
  tags: string[];
  spiceLevel?: 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
  allergens?: string[];
  isRecommended?: boolean;
  servingSize?: number;
}

interface Category {
  id: string;
  name: string;
  subcategories?: Array<{
    id: string;
    name: string;
  }>;
}

@Component({
  selector: 'app-add-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ modalTitle() }}</h2>
          <button type="button" class="close-btn" (click)="onCancel()">×</button>
        </div>

        <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Basic Information -->
          <div class="form-section">
            <h3>Basic Information</h3>

            <div class="form-group">
              <label for="name">Item Name *</label>
              <input
                type="text"
                id="name"
                formControlName="name"
                placeholder="Enter item name"
                [class.error]="nameFieldInvalid()">
              @if (nameFieldInvalid()) {
                <div class="error-message">
                  Item name is required
                </div>
              }
            </div>

            <div class="form-group">
              <label for="description">Description *</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Enter item description"
                rows="3"
                [class.error]="descriptionFieldInvalid()">
              </textarea>
              @if (descriptionFieldInvalid()) {
                <div class="error-message">
                  Description is required
                </div>
              }
            </div>
          </div>

          <!-- Category Selection -->
          <div class="form-section">
            <h3>Category</h3>

            <div class="form-group">
              <label for="categoryId">Category *</label>
              <select
                id="categoryId"
                formControlName="categoryId"
                [class.error]="categoryFieldInvalid()">
                <option value="">Select a category</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">
                    {{ category.name }}
                  </option>
                }
              </select>
              @if (categoryFieldInvalid()) {
                <div class="error-message">
                  Category is required
                </div>
              }
            </div>
          </div>

          <!-- Pricing -->
          <div class="form-section">
            <h3>Pricing</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="basePrice">Base Price *</label>
                <input
                  type="number"
                  id="basePrice"
                  formControlName="basePrice"
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  [class.error]="basePriceFieldInvalid()">
                @if (basePriceFieldInvalid()) {
                  <div class="error-message">
                    Valid price is required
                  </div>
                }
              </div>

              <div class="form-group">
                <label for="packingCharges">Packing Charges</label>
                <input
                  type="number"
                  id="packingCharges"
                  formControlName="packingCharges"
                  placeholder="Enter packing charges"
                  min="0"
                  step="0.01">
              </div>
            </div>
          </div>

          <!-- Item Details -->
          <div class="form-section">
            <h3>Item Details</h3>

            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="isVeg">
                  <span class="checkmark"></span>
                  Vegetarian
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="isRecommended">
                  <span class="checkmark"></span>
                  Recommended
                </label>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="spiceLevel">Spice Level</label>
                <select id="spiceLevel" formControlName="spiceLevel">
                  <option value="">Select spice level</option>
                  @for (level of spiceLevels(); track level.value) {
                    <option [value]="level.value">{{ level.label }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="servingSize">Serving Size</label>
                <input
                  type="number"
                  id="servingSize"
                  formControlName="servingSize"
                  placeholder="1"
                  min="1">
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="form-section">
            <h3>Images</h3>

            <div class="form-group">
              <label for="primaryImage">Primary Image URL *</label>
              <input
                type="url"
                id="primaryImage"
                formControlName="primaryImage"
                placeholder="https://example.com/image.jpg"
                [class.error]="primaryImageFieldInvalid()">
              @if (primaryImageFieldInvalid()) {
                <div class="error-message">
                  Valid image URL is required
                </div>
              }
            </div>
          </div>

          <!-- Tags -->
          <div class="form-section">
            <h3>Tags</h3>

            <div class="form-group">
              <label for="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                formControlName="tags"
                placeholder="spicy, popular, traditional">
              <small class="help-text">Enter tags separated by commas</small>
            </div>
          </div>

        </form>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="formInvalid() || isSubmitting()"
            (click)="onSubmit()">
            @if (isSubmitting()) {
              <span>{{ submitButtonLoadingText() }}</span>
            } @else {
              <span>{{ submitButtonText() }}</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./add-item-form.component.scss']
})
export class AddItemFormComponent {
  // Signal-based inputs
  isVisible = input(false);
  categories = input<Category[]>([]);
  selectedCategoryId = input<string | null>(null);
  editItem = input<MenuItem | null>(null);

  // Signal-based outputs
  itemCreated = output<void>();
  itemUpdated = output<void>();
  cancelled = output<void>();

  // Internal signals
  isSubmitting = signal(false);
  formValid = signal(false);

  // Computed signals
  isEditMode = computed(() => this.editItem() !== null);
  modalTitle = computed(() => this.isEditMode() ? 'Edit Menu Item' : 'Add Menu Item');
  submitButtonText = computed(() => this.isEditMode() ? 'Update Item' : 'Create Item');
  submitButtonLoadingText = computed(() => this.isEditMode() ? 'Updating...' : 'Creating...');
  formInvalid = computed(() => !this.formValid());

  // Form field validation computed signals
  nameFieldInvalid = computed(() => {
    const control = this.itemForm.get('name');
    return control ? control.invalid && control.touched : false;
  });

  descriptionFieldInvalid = computed(() => {
    const control = this.itemForm.get('description');
    return control ? control.invalid && control.touched : false;
  });

  categoryFieldInvalid = computed(() => {
    const control = this.itemForm.get('categoryId');
    return control ? control.invalid && control.touched : false;
  });

  basePriceFieldInvalid = computed(() => {
    const control = this.itemForm.get('basePrice');
    return control ? control.invalid && control.touched : false;
  });

  primaryImageFieldInvalid = computed(() => {
    const control = this.itemForm.get('primaryImage');
    return control ? control.invalid && control.touched : false;
  });

  // Static data as signals
  spiceLevels = signal([
    { value: 'MILD', label: 'Mild' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HOT', label: 'Hot' },
    { value: 'EXTRA_HOT', label: 'Extra Hot' }
  ]);

  itemForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.itemForm = this.createForm();

    // Subscribe to form validity changes
    this.itemForm.statusChanges.subscribe(() => {
      this.formValid.set(this.itemForm.valid);
    });

    // Set initial form validity
    this.formValid.set(this.itemForm.valid);

    // Effect to handle category pre-selection
    effect(() => {
      const categoryId = this.selectedCategoryId();
      if (categoryId) {
        this.itemForm.patchValue({ categoryId });
      }
    });

    // Effect to handle form pre-filling for edit mode
    effect(() => {
      const editItem = this.editItem();
      if (editItem) {
        this.prefillForm(editItem);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: ['', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      packingCharges: [0, [Validators.min(0)]],
      isVeg: [true],
      isRecommended: [false],
      spiceLevel: [''],
      servingSize: [1, [Validators.min(1)]],
      primaryImage: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      tags: ['']
    });
  }

  private prefillForm(item: MenuItem) {
    this.itemForm.patchValue({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      basePrice: item.basePrice,
      packingCharges: item.packingCharges || 0,
      isVeg: item.isVeg,
      isRecommended: item.isRecommended || false,
      spiceLevel: item.spiceLevel || '',
      servingSize: item.servingSize || 1,
      primaryImage: item.images.primary,
      tags: item.tags.join(', ')
    });
  }

  async onSubmit() {
    if (this.itemForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      try {
        const formValue = this.itemForm.value;

        const itemData = {
          name: formValue.name,
          description: formValue.description,
          categoryId: formValue.categoryId,
          basePrice: parseFloat(formValue.basePrice),
          packingCharges: parseFloat(formValue.packingCharges) || 0,
          isVeg: formValue.isVeg,
          isRecommended: formValue.isRecommended,
          spiceLevel: formValue.spiceLevel || undefined,
          servingSize: parseInt(formValue.servingSize) || 1,
          images: {
            primary: formValue.primaryImage,
            gallery: []
          },
          tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
          allergens: []
        };

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        let response;
        const editItem = this.editItem();

        if (this.isEditMode() && editItem?._id) {
          // Update existing item
          response = await fetch(`${environment.apiUrl}menu/items/${editItem._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
          });
        } else {
          // Create new item
          response = await fetch(`${environment.apiUrl}menu/items`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Item operation successful:', result);

        // Reset form
        this.itemForm.reset();

        // Emit success event
        if (this.isEditMode()) {
          this.itemUpdated.emit();
        } else {
          this.itemCreated.emit();
        }

      } catch (error) {
        console.error('Failed to save item:', error);
        alert(`Failed to ${this.isEditMode() ? 'update' : 'create'} item. Please try again.`);
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  onCancel() {
    this.itemForm.reset();
    this.cancelled.emit();
  }
}
