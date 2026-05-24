/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UsersService } from './users.service';
import { ImageValidatorService } from './services/image-validator.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpdateProfileDto as UpdateProfileDtoClass } from './dto/update-profile.dto';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const DEFAULT_AVATAR_FILENAME = 'default-avatar.svg';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imageValidator: ImageValidatorService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findMe(user.sub);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDtoClass,
  ) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validation = this.imageValidator.validate(file);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `avatar-${user.sub}${ext}`;
    const filePath = path.join(AVATARS_DIR, filename);

    await fs.mkdir(AVATARS_DIR, { recursive: true });

    const existingUser = await this.usersService.findMe(user.sub);
    const currentAvatarUrl = existingUser.profile?.avatarUrl;
    if (
      currentAvatarUrl &&
      !currentAvatarUrl.endsWith(DEFAULT_AVATAR_FILENAME)
    ) {
      const oldFilename = currentAvatarUrl.split('/').pop();
      if (oldFilename) {
        await fs
          .unlink(path.join(AVATARS_DIR, oldFilename))
          .catch(() => undefined);
      }
    }

    await fs.writeFile(filePath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    return this.usersService.updateAvatar(user.sub, avatarUrl);
  }

  @Delete('me/avatar')
  async removeAvatar(@CurrentUser() user: JwtPayload) {
    const existingUser = await this.usersService.findMe(user.sub);
    const currentAvatarUrl = existingUser.profile?.avatarUrl;

    if (
      currentAvatarUrl &&
      !currentAvatarUrl.endsWith(DEFAULT_AVATAR_FILENAME)
    ) {
      const oldFilename = currentAvatarUrl.split('/').pop();
      if (oldFilename) {
        await fs
          .unlink(path.join(AVATARS_DIR, oldFilename))
          .catch(() => undefined);
      }
    }

    return this.usersService.removeAvatar(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }
}
