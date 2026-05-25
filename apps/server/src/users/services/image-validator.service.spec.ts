import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ImageValidatorService } from './image-validator.service';

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'avatar',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: buildJpegBuffer(),
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

function buildJpegBuffer(): Buffer {
  const buffer = Buffer.alloc(16);

  buffer.writeUInt8(0xff, 0);
  buffer.writeUInt8(0xd8, 1);
  buffer.writeUInt8(0xff, 2);

  return buffer;
}

function buildPngBuffer(): Buffer {
  const buffer = Buffer.alloc(16);

  buffer.writeUInt8(0x89, 0);
  buffer.writeUInt8(0x50, 1);
  buffer.writeUInt8(0x4e, 2);
  buffer.writeUInt8(0x47, 3);
  buffer.writeUInt8(0x0d, 4);
  buffer.writeUInt8(0x0a, 5);
  buffer.writeUInt8(0x1a, 6);
  buffer.writeUInt8(0x0a, 7);

  return buffer;
}

function buildWebpBuffer(): Buffer {
  const buffer = Buffer.alloc(16);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(0, 4);
  buffer.write('WEBP', 8, 'ascii');

  return buffer;
}

describe('ImageValidatorService', () => {
  let service: ImageValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageValidatorService],
    }).compile();

    service = module.get<ImageValidatorService>(ImageValidatorService);
  });

  it('rejects an empty file (size 0)', () => {
    const file = makeFile({ size: 0, buffer: Buffer.alloc(0) });
    const result = service.validate(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a file larger than 2MB', () => {
    const file = makeFile({ size: 3 * 1024 * 1024 });
    const result = service.validate(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Image must be smaller than 2MB');
  });

  it('rejects an invalid MIME type', () => {
    const file = makeFile({ mimetype: 'text/plain' });
    const result = service.validate(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects an invalid file extension', () => {
    const file = makeFile({ originalname: 'photo.gif' });
    const result = service.validate(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a file with valid MIME but wrong magic bytes', () => {
    const badBuffer = Buffer.from(
      'this is not an image at all, just random text here!',
    );

    const file = makeFile({ buffer: badBuffer, size: badBuffer.length });
    const result = service.validate(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      'File content does not match an allowed image format',
    );
  });

  it('accepts a valid JPEG buffer', () => {
    const file = makeFile({ buffer: buildJpegBuffer(), size: 16 });
    const result = service.validate(file);

    expect(result.valid).toBe(true);
  });

  it('accepts a valid PNG buffer', () => {
    const file = makeFile({
      mimetype: 'image/png',
      originalname: 'photo.png',
      buffer: buildPngBuffer(),
      size: 16,
    });

    const result = service.validate(file);
    expect(result.valid).toBe(true);
  });

  it('accepts a valid WebP buffer', () => {
    const file = makeFile({
      mimetype: 'image/webp',
      originalname: 'photo.webp',
      buffer: buildWebpBuffer(),
      size: 16,
    });

    const result = service.validate(file);
    expect(result.valid).toBe(true);
  });
});
