import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardSelectItemComponent } from './select-item.component';

describe('ZardSelectItemComponent', () => {
  let fixture: ComponentFixture<ZardSelectItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardSelectItemComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardSelectItemComponent);
    fixture.componentRef.setInput('zValue', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set select host via setSelectHost', () => {
    const host = {
      selectedValue: () => ['other'],
      selectItem: jasmine.createSpy('selectItem'),
      navigateTo: jasmine.createSpy('navigateTo'),
    };
    fixture.componentInstance.setSelectHost(host);
    expect(host.selectedValue()).toEqual(['other']);
  });

  it('should call selectItem when onClick and not disabled', () => {
    const selectItemSpy = jasmine.createSpy('selectItem');
    const navigateToSpy = jasmine.createSpy('navigateTo');
    fixture.componentInstance.setSelectHost({
      selectedValue: () => [],
      selectItem: selectItemSpy,
      navigateTo: navigateToSpy,
    });
    fixture.detectChanges();
    fixture.componentInstance.onClick();
    expect(selectItemSpy).toHaveBeenCalledWith('test', '');
  });

  it('should not call selectItem when onClick and disabled', () => {
    fixture.componentRef.setInput('zDisabled', true);
    fixture.detectChanges();
    const selectItemSpy = jasmine.createSpy('selectItem');
    fixture.componentInstance.setSelectHost({
      selectedValue: () => [],
      selectItem: selectItemSpy,
      navigateTo: () => { /* noop */ },
    });
    fixture.componentInstance.onClick();
    expect(selectItemSpy).not.toHaveBeenCalled();
  });

  it('should call navigateTo when onMouseEnter and not disabled', () => {
    const navigateToSpy = jasmine.createSpy('navigateTo');
    fixture.componentInstance.setSelectHost({
      selectedValue: () => [],
      selectItem: () => { /* noop */ },
      navigateTo: navigateToSpy,
    });
    fixture.componentInstance.onMouseEnter();
    expect(navigateToSpy).toHaveBeenCalled();
  });

  it('should not call navigateTo when onMouseEnter and disabled', () => {
    fixture.componentRef.setInput('zDisabled', true);
    fixture.detectChanges();
    const navigateToSpy = jasmine.createSpy('navigateTo');
    fixture.componentInstance.setSelectHost({
      selectedValue: () => [],
      selectItem: () => { /* noop */ },
      navigateTo: navigateToSpy,
    });
    fixture.componentInstance.onMouseEnter();
    expect(navigateToSpy).not.toHaveBeenCalled();
  });
});
