import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';
import { type SurfaceModel } from '@anycms/a2ui-core';
import { mountDomSurface, type DomSurfaceHandle } from '@anycms/a2ui-dom';

/**
 * Hosts the framework-agnostic DOM renderer (mounts outside Angular). The same
 * SurfaceModel drives it as the Angular renderer — mirrors the Vue gallery's
 * DOM toggle. Mounts on view init and remounts whenever the `surface` input
 * changes; disposes on destroy.
 */
@Component({
  selector: 'app-dom-host',
  template: `<div #host></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomHostComponent implements AfterViewInit, OnDestroy {
  readonly surface = input.required<SurfaceModel>();
  private readonly el = inject(ElementRef<HTMLElement>);
  private handle?: DomSurfaceHandle;
  private ready = false;

  constructor() {
    // Remount when the surface input changes (after the initial view-init mount).
    effect(() => {
      this.surface(); // track
      if (this.ready) this.mount();
    });
  }

  ngAfterViewInit(): void {
    this.ready = true;
    this.mount();
  }

  private mount(): void {
    this.handle?.dispose();
    this.handle = mountDomSurface(this.surface(), this.el.nativeElement.firstElementChild as HTMLElement);
  }

  ngOnDestroy(): void {
    this.handle?.dispose();
  }
}
