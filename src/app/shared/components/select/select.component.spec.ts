import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ZardSelectComponent } from './select.component';
import { ZardSelectItemComponent } from './select-item.component';

@Component({
  selector: 'app-test-select-host',
  standalone: true,
  imports: [ZardSelectComponent, ZardSelectItemComponent],
  template: `
    <z-select [zMultiple]="multiple" [zMaxLabelCount]="maxLabelCount">
      <z-select-item [zValue]="'a'">A</z-select-item>
      <z-select-item [zValue]="'b'">B</z-select-item>
      <z-select-item [zValue]="'c'">C</z-select-item>
    </z-select>
  `,
})
class TestSelectHostComponent {
  multiple = false;
  maxLabelCount = 3;
}

describe('ZardSelectComponent', () => {
  let fixture: ComponentFixture<ZardSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardSelectComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should write value for single select', () => {
    fixture.componentInstance.writeValue('a');
    expect(fixture.componentInstance.zValue()).toBe('a');
  });

  it('should write value for multiple select', () => {
    fixture.componentRef.setInput('zMultiple', true);
    fixture.detectChanges();
    fixture.componentInstance.writeValue(['a', 'b']);
    expect(fixture.componentInstance.zValue()).toEqual(['a', 'b']);
  });

  it('should write null/empty as empty string for single select', () => {
    fixture.componentInstance.writeValue(null);
    expect(fixture.componentInstance.zValue()).toBe('');
  });

  it('should register onChange and call it when selectItem is called', () => {
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.selectItem('v1', 'Label 1');
    expect(onChange).toHaveBeenCalledWith('v1');
  });

  it('should register onTouched and call it when close is triggered', () => {
    const onTouched = jasmine.createSpy('onTouched');
    fixture.componentInstance.registerOnTouched(onTouched);
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(onTouched).toHaveBeenCalled();
  });

  it('should call setDisabledState without throwing', () => {
    expect(() => fixture.componentInstance.setDisabledState()).not.toThrow();
  });

  it('should not open when toggle is called and disabled', () => {
    fixture.componentRef.setInput('zDisabled', true);
    fixture.detectChanges();
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should update zValue when selectItem is called', () => {
    fixture.componentInstance.selectItem('x', 'X');
    expect(fixture.componentInstance.zValue()).toBe('x');
  });

  it('should not select item with invalid value', () => {
    const warnSpy = spyOn(console, 'warn').and.stub();
    fixture.componentInstance.selectItem(undefined as unknown as string, '');
    expect(fixture.componentInstance.zValue()).toBe('');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should toggle value in multiple mode when selecting same value again', () => {
    fixture.componentRef.setInput('zMultiple', true);
    fixture.detectChanges();
    fixture.componentInstance.writeValue(['a']);
    fixture.componentInstance.selectItem('a', 'A');
    expect(fixture.componentInstance.zValue()).toEqual([]);
  });

  it('should open dropdown on Enter key when closed', () => {
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    fixture.componentInstance.onTriggerKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('should open dropdown on Space key when closed', () => {
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    fixture.componentInstance.onTriggerKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('should close dropdown on Escape key when open', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    fixture.componentInstance.onTriggerKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should return selectedLabels for single select with zLabel', () => {
    fixture.componentRef.setInput('zLabel', 'Custom');
    fixture.componentInstance.writeValue('x');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLabels()).toEqual(['Custom']);
  });

  it('should return selectedLabels for multiple select', () => {
    fixture.componentRef.setInput('zMultiple', true);
    fixture.componentInstance.writeValue(['a', 'b']);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLabels()).toBeDefined();
    expect(Array.isArray(fixture.componentInstance.selectedLabels())).toBe(true);
  });

  it('should return selectedLabels for single select without zLabel when value has no matching item', () => {
    fixture.componentInstance.writeValue('rawValue');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLabels()).toEqual(['rawValue']);
  });

  it('should return empty selectedLabels for single select when value is empty', () => {
    fixture.componentInstance.writeValue('');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLabels()).toEqual([]);
  });

  it('should not select item when value is null', () => {
    const warnSpy = spyOn(console, 'warn').and.stub();
    fixture.componentInstance.selectItem(null as unknown as string, 'Label');
    expect(fixture.componentInstance.zValue()).toBe('');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should not select item when value is empty string', () => {
    const warnSpy = spyOn(console, 'warn').and.stub();
    fixture.componentInstance.selectItem('', 'Label');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should close and focus button after selectItem in single select', fakeAsync(() => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    const button = fixture.nativeElement.querySelector('button');
    const focusSpy = spyOn(button, 'focus');
    fixture.componentInstance.selectItem('v', 'V');
    expect(fixture.componentInstance.isOpen()).toBe(false);
    tick(0);
    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should call onDropdownKeydown Escape when open', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    fixture.componentInstance.onDropdownKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('should call onDropdownKeydown ArrowDown when open', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    fixture.componentInstance.onDropdownKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('should call onDropdownKeydown Home when open', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
    fixture.componentInstance.onDropdownKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('should call onDropdownKeydown End when open', () => {
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    fixture.componentInstance.onDropdownKeydown(ev);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

});

describe('ZardSelectComponent with content children', () => {
  let hostFixture: ComponentFixture<TestSelectHostComponent>;
  let selectComponent: ZardSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestSelectHostComponent],
    }).compileComponents();
    hostFixture = TestBed.createComponent(TestSelectHostComponent);
    hostFixture.detectChanges();
    selectComponent = hostFixture.debugElement.query(By.directive(ZardSelectComponent)).componentInstance as ZardSelectComponent;
  });

  it('should show selectedLabels with zMaxLabelCount and multiple selection', () => {
    hostFixture.componentInstance.multiple = true;
    hostFixture.componentInstance.maxLabelCount = 1;
    hostFixture.detectChanges();
    selectComponent.writeValue(['a', 'b', 'c']);
    hostFixture.detectChanges();
    const labels = selectComponent.selectedLabels();
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels.some((l) => l.includes('more') || l === 'A' || l === 'B' || l === 'C')).toBe(true);
  });

  it('should show "1 more item" when exactly one extra selected in multiple mode', () => {
    hostFixture.componentInstance.multiple = true;
    hostFixture.componentInstance.maxLabelCount = 1;
    hostFixture.detectChanges();
    selectComponent.writeValue(['a', 'b']);
    hostFixture.detectChanges();
    const labels = selectComponent.selectedLabels();
    expect(labels.some((l) => l === '1 more item selected')).toBe(true);
  });

  it('should select first item on Enter when dropdown is open', () => {
    selectComponent.toggle();
    hostFixture.detectChanges();
    selectComponent.onDropdownKeydown(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    hostFixture.detectChanges();
    expect(selectComponent.zValue()).toBe('a');
  });

  it('should select item on Space when dropdown is open', () => {
    selectComponent.toggle();
    hostFixture.detectChanges();
    selectComponent.onDropdownKeydown(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    hostFixture.detectChanges();
    expect(selectComponent.zValue()).toBe('a');
  });

  it('should navigate with ArrowDown and ArrowUp when dropdown is open', () => {
    selectComponent.toggle();
    hostFixture.detectChanges();
    selectComponent.onDropdownKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    hostFixture.detectChanges();
    selectComponent.onDropdownKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    hostFixture.detectChanges();
    expect(selectComponent.isOpen()).toBe(true);
  });
});
