import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardIconComponent } from './icon.component';

describe('ZardIconComponent', () => {
  let fixture: ComponentFixture<ZardIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardIconComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardIconComponent);
    fixture.componentRef.setInput('zType', 'check');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
