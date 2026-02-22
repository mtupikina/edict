import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardButtonComponent } from './button.component';

describe('ZardButtonComponent', () => {
  let fixture: ComponentFixture<ZardButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardButtonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardButtonComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
