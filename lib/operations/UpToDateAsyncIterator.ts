import type { Bindings, BindingsStream } from '@incremunica/incremental-types';
import { TransformIterator } from 'asynciterator';

export class UpToDateAsyncIterator extends TransformIterator<Bindings> {
  public get readable(): boolean {
    return (<any> this)._readable;
  }

  public set readable(readable: boolean) {
    readable = Boolean(readable) && !this.done;
    // Set the readable value only if it has changed
    if ((<any> this)._readable !== readable) {
      (<any> this)._readable = readable;
      // If the iterator became readable, emit the `readable` event
      if (readable) {
        this.emit('readable');
        return;
      }
      if (this.checkUpToDate(this)) {
        this.emit('up-to-date');
      }
    }
  }

  private checkUpToDate(bindingStream: BindingsStream): boolean {
    if ((<any>bindingStream)._readable) {
      return false;
    }
    if (bindingStream.getProperty) {
      const baseUpToDate = bindingStream.getProperty<boolean>('up-to-date');
      if (baseUpToDate) {
        return baseUpToDate;
      }
    }
    if ((<any>bindingStream)._sources) {
      for (const source of (<any>bindingStream)._sources) {
        if (!this.checkUpToDate(source)) {
          return false;
        }
      }
      return true;
    }
    if ((<any>bindingStream).currentIterators) {
      for (const source of (<any>bindingStream).currentIterators) {
        if (!this.checkUpToDate(source)) {
          return false;
        }
      }
      return true;
    }
    if ((<any>bindingStream)._source) {
      return this.checkUpToDate((<any>bindingStream)._source);
    }
    if ((<any>bindingStream).rightIterator && (<any>bindingStream).leftIterator) {
      if (!this.checkUpToDate((<any>bindingStream).rightIterator)) {
        return false;
      }
      return this.checkUpToDate((<any>bindingStream).leftIterator);
    }

    throw new Error(`Unknown binding stream type: ${bindingStream.constructor.name}\n${bindingStream}`);
  }
}
