import {
  Controller,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, UpdatePasswordDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto:AuthDto) {
    return this.authService.signin(dto);
  }

  @Patch('change-password')
  changePassword(@Body() dto: UpdatePasswordDto){
    return this.authService.changePassword(dto);
  }
}
