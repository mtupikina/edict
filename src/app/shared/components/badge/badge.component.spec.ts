import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardBadgeComponent } from './badge.component';

describe('ZardBadgeComponent', () => {
  let fixture: ComponentFixture<ZardBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ZardBadgeComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
