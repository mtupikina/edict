import { OverlayModule } from '@angular/cdk/overlay';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  type ComponentPortal,
  PortalModule,
  type TemplatePortal,
} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  computed,
  ElementRef,
  type EmbeddedViewRef,
  type EventEmitter,
  inject,
  NgModule,
  output,
  type TemplateRef,
  type Type,
  viewChild,
  type ViewContainerRef,
} from '@angular/core';

import { mergeClasses, noopFn } from '@/shared/utils/merge-classes';

import type { ZardDialogRef } from './dialog-ref';
import { ZardDialogService } from './dialog.service';
import { dialogVariants } from './dialog.variants';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';

// Used by the NgModule provider definition

export type OnClickCallback<T> = (instance: T) => false | void | object;
export class ZardDialogOptions<T, U> {
  zCancelIcon?: ZardIcon;
  zCancelText?: string | null;
  zClosable?: boolean;
  zContent?: string | TemplateRef<T> | Type<T>;
  zCustomClasses?: string;
  zData?: U;
  zDescription?: string;
  zHideFooter?: boolean;
  zMaskClosable?: boolean;
  zOkDestructive?: boolean;
  zOkDisabled?: boolean;
  zOkIcon?: ZardIcon;
  zOkText?: string | null;
  zOnCancel?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  zOnOk?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  zTitle?: string | TemplateRef<T>;
  zViewContainerRef?: ViewContainerRef;
  zWidth?: string;
}

@Component({
  selector: 'z-dialog',
  imports: [OverlayModule, PortalModule, ZardButtonComponent, ZardIconComponent],
  templateUrl: './dialog.component.html',
  styles: `
    :host {
      opacity: 1;
      transform: scale(1);
      transition:
        opacity 150ms ease-out,
        transform 150ms ease-out;
    }

    @starting-style {
      :host {
        opacity: 0;
        transform: scale(0.9);
      }
    }

    :host.dialog-leave {
      opacity: 0;
      transform: scale(0.9);
      transition:
        opacity 150ms ease-in,
        transform 150ms ease-in;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style.width]': 'config.zWidth ? config.zWidth : null',
    'animate.enter': 'dialog-enter',
    'animate.leave': 'dialog-leave',
  },
  exportAs: 'zDialog',
})
export class ZardDialogComponent<T, U> extends BasePortalOutlet {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly config = inject(ZardDialogOptions<T, U>);

  protected readonly classes = computed(() => mergeClasses(dialogVariants(), this.config.zCustomClasses));
  dialogRef?: ZardDialogRef<T>;

  protected readonly isStringContent = typeof this.config.zContent === 'string';

  readonly portalOutlet = viewChild.required(CdkPortalOutlet);

  okTriggered = output<void>();
  cancelTriggered = output<void>();

  constructor() {
    super();
  }

  getNativeElement(): HTMLElement {
    return this.host.nativeElement;
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }
    return this.portalOutlet()?.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }

    return this.portalOutlet()?.attachTemplatePortal(portal);
  }

  onOkClick() {
    this.okTriggered.emit();
  }

  onCloseClick() {
    this.cancelTriggered.emit();
  }
}

@NgModule({
  imports: [ZardButtonComponent, ZardDialogComponent, OverlayModule, PortalModule],
  providers: [ZardDialogService],
})
export class ZardDialogModule {}
