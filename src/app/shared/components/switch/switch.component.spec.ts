import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardSwitchComponent } from './switch.component';

describe('ZardSwitchComponent', () => {
  let component: ZardSwitchComponent;
  let fixture: ComponentFixture<ZardSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardSwitchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZardSwitchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggled value on click', () => {
    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();
    let emitted: boolean | undefined;
    component.checkedChange.subscribe((v) => (emitted = v));
    component.toggle();
    expect(emitted).toBe(true);
  });

  it('should emit false when checked is true and toggle', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    let emitted: boolean | undefined;
    component.checkedChange.subscribe((v) => (emitted = v));
    component.toggle();
    expect(emitted).toBe(false);
  });

  it('should not emit when disabled', () => {
    fixture.componentRef.setInput('checked', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    let emitted: boolean | undefined;
    component.checkedChange.subscribe((v) => (emitted = v));
    component.toggle();
    expect(emitted).toBeUndefined();
  });
});
