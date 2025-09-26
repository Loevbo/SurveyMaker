import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  HostListener,
  input,
  Input,
  output,
  Output,
  signal,
} from '@angular/core';
import { IconItem, LUCIDE_ICONS } from '../icons.data';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './icon-picker-component.html',
  styleUrl: './icon-picker-component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class IconPickerComponent {
  // currently selected icon (from parent)
  icon = input<string>('lucide:mail');
  // emit when user chooses
  picked = output<string>();
  // UI state
  opened = signal(false);
  search = signal('');

  open() {
    this.opened.set(true);
  }
  close() {
    this.opened.set(false);
  }

  reset() {
    this.search.set('');
  }
  useCurrent(i: string) {
    this.picked.emit(i);
    this.close();
  }

  private catalog: IconItem[] = LUCIDE_ICONS;


  filteredIcons(): string[] {
    const q = this.search().trim().toLowerCase();
    return this.catalog
      .filter(
        i => !q || i.name.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))
      )
      .map(i => `lucide:${i.name}`);
  }

  onBackdropClick(e: MouseEvent) {
    // Click outside the modal → close
    if ((e.target as HTMLElement).classList.contains('picker-overlay')) this.close();
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') this.close();
  }
}
