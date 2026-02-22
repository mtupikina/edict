import { EventEmitter } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { OverlayRef } from '@angular/cdk/overlay';

import { ZardDialogRef } from './dialog-ref';
import { ZardDialogComponent, ZardDialogOptions } from './dialog.component';

describe('ZardDialogRef', () => {
  const mockPlatformId = {}; // non-browser to avoid keydown/outsidePointerEvents
  let mockOverlayRef: jasmine.SpyObj<Pick<OverlayRef, 'hasAttached' | 'detachBackdrop' | 'dispose'>>;
  let mockContainer: {
    cancelTriggered: EventEmitter<void>;
    okTriggered: EventEmitter<void>;
    getNativeElement: () => HTMLElement;
  };
  let config: ZardDialogOptions<unknown, unknown>;

  beforeEach(() => {
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['hasAttached', 'detachBackdrop', 'dispose']);
    mockOverlayRef.hasAttached.and.returnValue(true);
    mockContainer = {
      cancelTriggered: new EventEmitter(),
      okTriggered: new EventEmitter(),
      getNativeElement: () => document.createElement('div'),
    };
    config = new ZardDialogOptions<unknown, unknown>();
  });

  function createRef(
    zOnOk?: ZardDialogOptions<unknown, unknown>['zOnOk'],
    zOnCancel?: ZardDialogOptions<unknown, unknown>['zOnCancel']
  ): ZardDialogRef {
    config.zOnOk = zOnOk;
    config.zOnCancel = zOnCancel;
    return new ZardDialogRef(
      mockOverlayRef as unknown as OverlayRef,
      config,
      mockContainer as unknown as ZardDialogComponent<unknown, unknown>,
      mockPlatformId
    );
  }

  it('should close and dispose overlay after timeout', fakeAsync(() => {
    const ref = createRef();
    ref.close();
    expect(mockOverlayRef.dispose).not.toHaveBeenCalled();
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

  it('should close with result when close(result) is called', fakeAsync(() => {
    const ref = createRef();
    ref.componentInstance = { id: 1 };
    ref.close('done');
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

  it('should not close again if already closing', fakeAsync(() => {
    const ref = createRef();
    ref.close();
    ref.close('again');
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalledTimes(1);
  }));

  it('should close when okTriggered and zOnOk is undefined (noop)', fakeAsync(() => {
    createRef();
    mockContainer.okTriggered.emit();
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

  it('should close with callback result when zOnOk returns a value', fakeAsync(() => {
    const ref = createRef(() => ({ value: 'ok-result' }));
    ref.componentInstance = {};
    mockContainer.okTriggered.emit();
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

  it('should not close when zOnOk returns false', () => {
    createRef(() => false);
    mockContainer.okTriggered.emit();
    expect(mockOverlayRef.dispose).not.toHaveBeenCalled();
  });

  it('should close when cancelTriggered and zOnCancel is undefined', fakeAsync(() => {
    createRef();
    mockContainer.cancelTriggered.emit();
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

  it('should close with callback result when zOnCancel returns a value', fakeAsync(() => {
    const ref = createRef(undefined, () => ({ value: 'cancel-result' }));
    ref.componentInstance = {};
    mockContainer.cancelTriggered.emit();
    tick(150);
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  }));

});
