import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.service.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.service.refresh(token);
  }

  @Post('logout')
  logout(@Body('refreshToken') token: string): Promise<void> {
    return this.service.logout(token);
  }
}
