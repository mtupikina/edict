import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { ZardDialogService } from './dialog.service';
import { ZardDialogOptions } from './dialog.component';

@Component({ standalone: true, template: '' })
class DummyContentComponent {}

describe('ZardDialogService', () => {
  let service: ZardDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [ZardDialogService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ZardDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create and return a dialog ref when open with a component', () => {
    const config = new ZardDialogOptions<DummyContentComponent, unknown>();
    config.zContent = DummyContentComponent;
    config.zTitle = 'Test';
    const ref = service.create(config);
    expect(ref).toBeTruthy();
    expect(ref.componentInstance).toBeTruthy();
    ref.close();
  });

  it('should set componentInstance when content is a component', () => {
    const config = new ZardDialogOptions<DummyContentComponent, unknown>();
    config.zContent = DummyContentComponent;
    config.zTitle = 'Test';
    const ref = service.create(config);
    expect(ref.componentInstance).toBeInstanceOf(DummyContentComponent);
    ref.close();
  });

});
