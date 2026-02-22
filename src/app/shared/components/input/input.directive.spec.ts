import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { ZardInputDirective } from './input.directive';

@Component({
  selector: 'app-test-input-host',
  standalone: true,
  imports: [ZardInputDirective, FormsModule],
  template: '<input z-input [(ngModel)]="value" />',
})
class HostComponent {
  value = '';
}

describe('ZardInputDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardInputDirective, HostComponent, FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should create', () => {
    expect(inputEl).toBeTruthy();
  });

  it('should update value on input', () => {
    inputEl.value = 'test';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value).toBe('test');
  });

  it('writeValue should set value on element', () => {
    const directive = fixture.debugElement.query(By.directive(ZardInputDirective)).injector.get(ZardInputDirective);
    directive.writeValue('written');
    expect(inputEl.value).toBe('written');
  });

  it('setDisabledState should disable element', () => {
    const directive = fixture.debugElement.query(By.directive(ZardInputDirective)).injector.get(ZardInputDirective);
    directive.setDisabledState(true);
    expect(inputEl.disabled).toBe(true);
    directive.setDisabledState(false);
    expect(inputEl.disabled).toBe(false);
  });

  it('registerOnChange and registerOnTouched should not throw', () => {
    const directive = fixture.debugElement.query(By.directive(ZardInputDirective)).injector.get(ZardInputDirective);
    directive.registerOnChange(() => { /* noop */ });
    directive.registerOnTouched(() => { /* noop */ });
    inputEl.dispatchEvent(new Event('blur'));
    expect().nothing();
  });

  it('setDataSlot should set data-slot on element', () => {
    const directive = fixture.debugElement.query(By.directive(ZardInputDirective)).injector.get(ZardInputDirective);
    directive.setDataSlot('test-slot');
    expect(inputEl.dataset['slot']).toBe('test-slot');
  });
});
