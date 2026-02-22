import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentPortal } from '@angular/cdk/portal';

import { ZardDialogComponent, ZardDialogOptions } from './dialog.component';

describe('ZardDialogComponent', () => {
  let fixture: ComponentFixture<ZardDialogComponent<unknown, unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardDialogComponent],
      providers: [{ provide: ZardDialogOptions, useValue: new ZardDialogOptions() }],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should return native element from getNativeElement()', () => {
    const el = fixture.componentInstance.getNativeElement();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el).toBe(fixture.debugElement.nativeElement);
  });

  it('should emit when onOkClick is called', () => {
    expect(() => fixture.componentInstance.onOkClick()).not.toThrow();
  });

  it('should emit when onCloseClick is called', () => {
    expect(() => fixture.componentInstance.onCloseClick()).not.toThrow();
  });

  it('should throw when attachComponentPortal is called and portal outlet already has content', () => {
    const outlet = fixture.componentInstance.portalOutlet();
    spyOn(outlet, 'hasAttached').and.returnValue(true);
    const portal = new ComponentPortal(class {} as never);
    expect(() => fixture.componentInstance.attachComponentPortal(portal)).toThrowError(
      /Attempting to attach modal content after content is already attached/
    );
  });

  it('should throw when attachTemplatePortal is called and portal outlet already has content', () => {
    const outlet = fixture.componentInstance.portalOutlet();
    spyOn(outlet, 'hasAttached').and.returnValue(true);
    const portal = {} as import('@angular/cdk/portal').TemplatePortal<unknown>;
    expect(() => fixture.componentInstance.attachTemplatePortal(portal)).toThrowError(
      /Attempting to attach modal content after content is already attached/
    );
  });
});
