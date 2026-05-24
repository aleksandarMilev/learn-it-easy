import { Injectable } from '@nestjs/common';
import * as path from 'path';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

@Injectable()
export class ImageValidatorService {
  validate(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'Image must be smaller than 2MB' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type' };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'Invalid file extension' };
    }

    const result = this.#validateMagicBytes(file.buffer);
    if (!result) {
      return {
        valid: false,
        error: 'File content does not match an allowed image format',
      };
    }

    return { valid: true };
  }

  #validateMagicBytes(buffer: Buffer): boolean {
    const bytes = buffer.subarray(0, 16);

    if (bytes.length < 12) {
      return false;
    }

    const readByte = (offset: number): number => bytes.readUInt8(offset);

    const isJpeg =
      readByte(0) === 0xff && readByte(1) === 0xd8 && readByte(2) === 0xff;

    const isPng =
      readByte(0) === 0x89 &&
      readByte(1) === 0x50 &&
      readByte(2) === 0x4e &&
      readByte(3) === 0x47 &&
      readByte(4) === 0x0d &&
      readByte(5) === 0x0a &&
      readByte(6) === 0x1a &&
      readByte(7) === 0x0a;

    const isWebp =
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP';

    const avifBrand = bytes.subarray(8, 12).toString('ascii');
    const isAvif =
      bytes.subarray(4, 8).toString('ascii') === 'ftyp' &&
      (avifBrand === 'avif' || avifBrand === 'avis');

    return isJpeg || isPng || isWebp || isAvif;
  }
}
