import {
  Directive,
  type EmbeddedViewRef,
  inject,
  input,
  type OnDestroy,
  TemplateRef,
  ViewContainerRef,
  effect,
  type EffectRef,
} from '@angular/core';

export function isTemplateRef(value: unknown): value is TemplateRef<unknown> {
  return value instanceof TemplateRef;
}

export interface ZardStringTemplateOutletContext<T = unknown> {
  $implicit: T;
  [key: string]: unknown;
}

@Directive({
  selector: '[zStringTemplateOutlet]',
  exportAs: 'zStringTemplateOutlet',
})
export class ZardStringTemplateOutletDirective<T> implements OnDestroy {
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef<ZardStringTemplateOutletContext<T>>);

  private embeddedViewRef: EmbeddedViewRef<ZardStringTemplateOutletContext<T>> | null = null;
  private readonly context = {} as ZardStringTemplateOutletContext<T>;

  #isFirstChange = true;
  #lastOutletWasTemplate = false;
  #lastTemplateRef: TemplateRef<ZardStringTemplateOutletContext<T>> | null = null;
  #lastContext?: ZardStringTemplateOutletContext<T>;

  readonly zStringTemplateOutletContext = input<ZardStringTemplateOutletContext<T> | undefined>(undefined);
  readonly zStringTemplateOutlet = input.required<TemplateRef<ZardStringTemplateOutletContext<T>> | T>();

  #hasContextShapeChanged(context: ZardStringTemplateOutletContext<T> | undefined): boolean {
    if (!context) return false;
    const prevCtxKeys = Object.keys(this.#lastContext ?? {});
    const currCtxKeys = Object.keys(context ?? {});
    if (prevCtxKeys.length !== currCtxKeys.length) return true;
    for (const propName of currCtxKeys) {
      if (!prevCtxKeys.includes(propName)) return true;
    }
    return false;
  }

  #shouldViewBeRecreated(
    stringTemplateOutlet: TemplateRef<ZardStringTemplateOutletContext<T>> | T,
    stringTemplateOutletContext: ZardStringTemplateOutletContext<T> | undefined
  ): boolean {
    const isTemplate = isTemplateRef(stringTemplateOutlet);
    const shouldOutletRecreate =
      this.#isFirstChange ||
      isTemplate !== this.#lastOutletWasTemplate ||
      (isTemplate && stringTemplateOutlet !== this.#lastTemplateRef);
    const shouldContextRecreate = this.#hasContextShapeChanged(stringTemplateOutletContext);
    return shouldContextRecreate || shouldOutletRecreate;
  }

  #updateTrackingState(
    stringTemplateOutlet: TemplateRef<ZardStringTemplateOutletContext<T>> | T,
    stringTemplateOutletContext: ZardStringTemplateOutletContext<T> | undefined
  ): void {
    const isTemplate = isTemplateRef(stringTemplateOutlet);
    if (this.#isFirstChange && !isTemplate) this.#isFirstChange = false;
    if (stringTemplateOutletContext !== undefined) this.#lastContext = stringTemplateOutletContext;
    this.#lastOutletWasTemplate = isTemplate;
    this.#lastTemplateRef = isTemplate ? stringTemplateOutlet : null;
  }

  readonly #viewEffect: EffectRef = effect(() => {
    const stringTemplateOutlet = this.zStringTemplateOutlet();
    const stringTemplateOutletContext = this.zStringTemplateOutletContext();

    if (!this.#isFirstChange && isTemplateRef(stringTemplateOutlet)) this.#isFirstChange = true;
    if (!isTemplateRef(stringTemplateOutlet)) {
      (this.context as ZardStringTemplateOutletContext<T>)['$implicit'] = stringTemplateOutlet as T;
    }

    const recreateView = this.#shouldViewBeRecreated(
      stringTemplateOutlet as TemplateRef<ZardStringTemplateOutletContext<T>> | T,
      stringTemplateOutletContext
    );
    this.#updateTrackingState(
      stringTemplateOutlet as TemplateRef<ZardStringTemplateOutletContext<T>> | T,
      stringTemplateOutletContext
    );

    if (recreateView) {
      this.#recreateView(
        stringTemplateOutlet as TemplateRef<ZardStringTemplateOutletContext<T>>,
        stringTemplateOutletContext
      );
    } else {
      this.#updateContext(
        stringTemplateOutlet as TemplateRef<ZardStringTemplateOutletContext<T>> | T,
        stringTemplateOutletContext
      );
    }
  });

  #recreateView(
    outlet: TemplateRef<ZardStringTemplateOutletContext<T>>,
    context: ZardStringTemplateOutletContext<T> | undefined
  ): void {
    this.viewContainer.clear();
    this.embeddedViewRef = this.viewContainer.createEmbeddedView(outlet, context);
  }

  #updateContext(
    outlet: TemplateRef<ZardStringTemplateOutletContext<T>> | T,
    context: ZardStringTemplateOutletContext<T> | undefined
  ): void {
    const newCtx = isTemplateRef(outlet) ? context : this.context;
    let oldCtx = this.embeddedViewRef?.context;
    if (!oldCtx) oldCtx = newCtx;
    else if (newCtx && typeof newCtx === 'object') {
      for (const propName of Object.keys(newCtx)) {
        (oldCtx as Record<string, unknown>)[propName] = (newCtx as Record<string, unknown>)[propName];
      }
    }
    this.#lastContext = oldCtx as ZardStringTemplateOutletContext<T>;
  }

  ngOnDestroy(): void {
    this.#viewEffect.destroy();
    this.viewContainer.clear();
    this.embeddedViewRef = null;
  }
}
